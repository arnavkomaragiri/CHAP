import torch

import numpy as np

from typing import Any
from transformers import pipeline
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import TransformersNlpEngine

default_device = "cuda:0" if torch.cuda.is_available() else "cpu"
default_dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float16
rng = np.random.default_rng()

model_config = [{"lang_code": "en", "model_name": {
    "spacy": "en_core_web_sm",  # use a small spaCy model for lemmas, tokens etc.
    "transformers": "dslim/bert-base-NER"
    }
}]

nlp_engine = TransformersNlpEngine(models=model_config)
analyzer = AnalyzerEngine(nlp_engine=nlp_engine)

def init_mask_pipeline(device: str = default_device, dtype: Any = default_dtype) -> pipeline:
    return pipeline("fill-mask", device=device, torch_dtype=dtype)

def multi_mask(pipe: pipeline, text: str, mask_tok: str = "<mask>", top_k: int = 1) -> str:
    while True:
        mask_count = text.count(mask_tok)
        if mask_count == 0:
            break
        subs = pipe(text, top_k=top_k)
        if mask_count > 1:
            subs = subs[int(rng.choice(mask_count, 1)[0])]
        text = subs[0]['sequence']
    return text

def anonymize(pipe: pipeline, text: str, scrub_pii: bool = True, language: str = "en",
              p_mask: float = 0.5, mask_tok: str = "<mask>", top_k: int = 1) -> str:
    if scrub_pii:
        results = analyzer.analyze(text, language=language)
        replace_list = []
        for r in results:
            replace_list += [text[r.start:r.end]]
        for r in replace_list:
            text = text.replace(r, mask_tok)
    
    tokens = text.split()
    masked_mask = rng.binomial(1, p_mask, len(tokens))
    for i, m in enumerate(masked_mask):
        if m == 1 and tokens[i].endswith('.'):
            tokens[i] = mask_tok + '.'
        elif m == 1 and tokens[i].endswith(','):
            tokens[i] = mask_tok + ','
        elif m == 1:
            tokens[i] = mask_tok
    masked_text = ' '.join(tokens)
    return multi_mask(pipe, masked_text, mask_tok=mask_tok, top_k=top_k)
