from typing import List, Dict

system_prompt = "You are a superintelligent AI assistant who excels at using sources to answer questions. You are very careful to not spread false information, and will always clearly state you don't know when faced with a question you can't answer. Take a deep breath and work with the user to answer their questions."
query_prompt = "You are a search engine expert who excels at figuring out which questions to Google or search. Use the below conversation history to figure out which text queries to search given the user's most recent question.\nHistory:\n{history_str}\nOutput only your search queries in JSON format with queries being in a list with key \"queries\", this response will be run directly into a search engine. If no queries are needed, just output an empty list in JSON. Any errors caused by unformatted outputs will crash this program."

def get_prompt_string(conv_history: List[Dict]) -> str:
    out = ""
    for i, msg in enumerate(conv_history):
        out += f"{msg['role']}:\t{msg['content']}"
        if i != len(conv_history) - 1:
            out += "\n\n"
    return out

def get_query_prompt(conv_history: List[Dict]) -> str:
    history_str = get_prompt_string(conv_history)
    return query_prompt.format(history_str=history_str)