import sys
import os
import json
import pickle
import tempfile
from telethon import TelegramClient
from telethon.sessions import StringSession
import asyncio

STATE_DIR = os.path.join(tempfile.gettempdir(), 'tg1_sessions')
os.makedirs(STATE_DIR, exist_ok=True)

def get_state_path(phone):
    safe_phone = phone.replace('+', '').replace(' ', '')
    return os.path.join(STATE_DIR, f'{safe_phone}.pkl')

def save_state(phone, obj):
    with open(get_state_path(phone), 'wb') as f:
        pickle.dump(obj, f)

def load_state(phone):
    try:
        with open(get_state_path(phone), 'rb') as f:
            return pickle.load(f)
    except Exception:
        return None

def clear_state(phone):
    try:
        os.remove(get_state_path(phone))
    except Exception:
        pass

async def send_code(phone, api_id, api_hash):
    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.connect()
    try:
        sent = await client.send_code_request(phone)
        # Сохраняем client.session и phone_code_hash
        save_state(phone, {
            'session': client.session.save(),
            'phone_code_hash': sent.phone_code_hash,
            'api_id': api_id,
            'api_hash': api_hash
        })
        print(json.dumps({'ok': True, 'phone_code_hash': sent.phone_code_hash}))
    except Exception as e:
        print(json.dumps({'ok': False, 'error': str(e)}))
    finally:
        await client.disconnect()

async def sign_in(phone, code, password=None):
    state = load_state(phone)
    if not state:
        print(json.dumps({'ok': False, 'error': 'No state found for this phone'}))
        return
    api_id = state['api_id']
    api_hash = state['api_hash']
    session_str = state['session']
    phone_code_hash = state['phone_code_hash']
    client = TelegramClient(StringSession(session_str), api_id, api_hash)
    await client.connect()
    try:
        if password:
            await client.sign_in(password=password)
        else:
            await client.sign_in(phone=phone, code=code, phone_code_hash=phone_code_hash)
        session_str = client.session.save()
        clear_state(phone)
        print(json.dumps({'ok': True, 'session': session_str}))
    except Exception as e:
        print(json.dumps({'ok': False, 'error': str(e)}))
    finally:
        await client.disconnect()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'ok': False, 'error': 'No command'}))
        sys.exit(1)
    command = sys.argv[1]
    if command == 'send_code':
        _, _, phone, api_id, api_hash = sys.argv
        asyncio.run(send_code(phone, int(api_id), api_hash))
    elif command == 'sign_in':
        # sys.argv: [telegram_worker.py, sign_in, phone, code] (4) или [telegram_worker.py, sign_in, phone, code, password] (5)
        if len(sys.argv) == 4:
            _, _, phone, code = sys.argv
            asyncio.run(sign_in(phone, code))
        elif len(sys.argv) == 5:
            _, _, phone, code, password = sys.argv
            asyncio.run(sign_in(phone, code, password))
        else:
            print(json.dumps({'ok': False, 'error': 'Invalid arguments for sign_in'}))
            sys.exit(1)
    else:
        print(json.dumps({'ok': False, 'error': 'Unknown command'}))
        sys.exit(1)
