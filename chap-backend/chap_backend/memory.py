import psycopg2
import uuid

from enum import Enum
from typing import List, Dict
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
    chunks = [{'uuid': uuid.uuid4(), 'doc': doc} for doc in docs]
    return chunks

def connect(connection_str: str) -> psycopg2.extensions.connection:
    return psycopg2.connect(connection_str)

def disconnect(connection: psycopg2.extensions.connection):
    connection.close()

def create_table(cursor: psycopg2.extensions.cursor, table_name: str):
    cursor.execute(f"CREATE TABLE {table_name} (conv_id text, chunk_id text, doc text);")

def push_data(cursor: psycopg2.extensions.cursor, table_name: str, conv_id: str, chunks: List[Document]):
    for chunk in chunks:
        cursor.execute(f"INSERT INTO {table_name} (conv_id, chunk_id, doc) VALUES ('{conv_id}', '{chunk['uuid']}', '{chunk['doc'].page_content}');")