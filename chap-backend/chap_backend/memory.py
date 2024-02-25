import psycopg2
import uuid

from enum import Enum
from typing import List, Dict, Union, Tuple, Optional
from .anon import *
from langchain.text_splitter import RecursiveCharacterTextSplitter, HTMLHeaderTextSplitter, Document

TEXT_TYPE = Enum("TEXT_TYPE", ["PDF", "HTML"])
CHUNK_TABLE_NAME = "PAGECHUNK"

pipe = init_mask_pipeline()
p_mask = 0.2

def parse_text(text: str, text_type: TEXT_TYPE, chunk_size: int = 500, chunk_overlap: int = 30, anon_text: bool = False) -> List[Document]:
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
    if text_type == TEXT_TYPE.HTML:
        docs = char_splitter.split_documents(docs)
    else:
        docs = char_splitter.split_text(docs[0])
    if anon_text:
        chunks = [anonymize(pipe, c, p_mask=p_mask) for c in docs]
    chunks = [{'uuid': uuid.uuid4(), 'doc': doc} for doc in docs]
    return chunks

def connect(connection_str: str) -> psycopg2.extensions.connection:
    return psycopg2.connect(connection_str)

def disconnect(connection: psycopg2.extensions.connection):
    connection.close()

def create_table(connection: psycopg2.extensions.connection, cursor: psycopg2.extensions.cursor, table_name: str):
    query(cursor, f"CREATE TABLE {table_name} (conv_id text, chunk_id text, doc text);")
    connection.commit()

# this should be considered a war crime
def table_exists(connection: psycopg2.extensions.connection, cursor: psycopg2.extensions.cursor, table_name: str) -> bool:
    try:
        cursor.execute(f"SELECT * FROM {table_name};")
    except Exception as e:
        cursor.execute("rollback;")
        return True
    return False

def push_data(connection: psycopg2.extensions.connection, cursor: psycopg2.extensions.cursor, 
              table_name: str, conv_id: str, chunks: List[dict]):
    num_chunk = len(chunks)
    print(num_chunk)
    i = 0
    for chunk in chunks:
        try:
            doc = chunk['doc'].page_content
        except Exception as e:
            doc = chunk['doc']
        doc = doc.replace("'", "")
        query = f"INSERT INTO {table_name} (conv_id, chunk_id, doc) VALUES (%s, %s, %s);"
        data = (str(conv_id), str(chunk['uuid']), doc)
        cursor.execute(query, data)
        i += 1
        print(f"{i} / {num_chunk}")
    print("AAAAAAAAAAAAAAAAAAAA")
    print(f"COUNTER: {i}")
    connection.commit()

def load_page(conn: psycopg2.extensions.connection, text: str, text_type: TEXT_TYPE, **kwargs) -> str:
    conv_id = None
    try:
        cur = conn.cursor()
        # this is also garbage
        try:
            create_table(conn, cur, CHUNK_TABLE_NAME)
        except Exception as e:
            print(e)
            pass
        chunks = parse_text(text, text_type=text_type, **kwargs)
        print(f"CHUNK LEN: {len(chunks)}, {chunks[127]}")
        conv_id = uuid.uuid4()
        push_data(conn, cur, CHUNK_TABLE_NAME, conv_id, chunks)
        cur.close()
    except Exception as e:
        print(e)
        cur.execute("rollback;")
    return conv_id

def query(cur: psycopg2.extensions.cursor, query: str) -> List:
    try:
        cur.execute(query)
        return cur.fetchall()
    except Exception as e:
        cur.execute("rollback;")
        raise e

def get_conv_chunks(conn: psycopg2.extensions.connection, conv_id: str) -> List[str]:
    try:
        cur = conn.cursor()
        return query(cur, f"SELECT * FROM PAGECHUNKS WHERE conv_id='{conv_id}'")
    except Exception as e:
        raise e

def configure_vector_db(conn: psycopg2.extensions.connection, api_key: str):
    try:
        cur = conn.cursor()
        query(cur, f"""SELECT vectorize.table(job_name => 'chunk_search', "table" => '{CHUNK_TABLE_NAME}',primary_key => 'chunk_id',columns => ARRAY['doc']);""")
        query(cur, "SELECT vectorize.job_execute('chunk_search');")
    except Exception as e:
        print(e)
    cur.close()

def clear_chunks(conn: psycopg2.extensions.connection):
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {CHUNK_TABLE_NAME};")
    conn.commit()

def vector_search(conn: psycopg2.extensions.connection, query_str: str, conv_id: Optional[str] = None, k: int = 3) -> List[Dict]:
    # query_str = query_str.replace("'", "\'")
    try:
        cur = conn.cursor()
        query_str = f"SELECT * FROM vectorize.search(job_name => 'chunk_search', query => '{query_str}', return_columns => ARRAY['conv_id', 'chunk_id', 'doc'], num_results => {k});"
        results = query(cur, query_str)
        print(f"LENTH OF RESULTS {len(results)}")
        results = [r[0] for r in results]
        if conv_id is not None:
            return [r for r in results if r['conv_id'] == conv_id]
        return results
    except Exception as e:
        raise e
