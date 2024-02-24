from enum import Enum
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter, HTMLHeaderTextSplitter, Document

TEXT_TYPE = Enum("TEXT_TYPE", ["PDF", "HTML"])

def parse_text(text: str, text_type: TEXT_TYPE, chunk_size: int = 500, chunk_overlap: int = 30) -> List[Document]:
    docs = [text]
    if text_type == TEXT_TYPE.HTML:
        headers_to_split_on = [
            ("h1", "Header 1"),
            ("h2", "Header 2"),
            ("h3", "Header 3"),
            ("h4", "Header 4"),
        ]

        html_splitter = HTMLHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
        docs = html_splitter.split_text(text)
    
    char_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    docs = char_splitter.split_documents(docs)
    return docs
