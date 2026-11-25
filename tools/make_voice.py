"""Make the app's spoken clips with a Google Cloud Text-to-Speech voice.

Run from the Kut folder:
    python tools/make_voice.py
It reads sounds/tts/texts.json, saves one MP3 per phrase in sounds/tts/,
and writes sounds/tts/clips.json, the list the app uses to find them.
Clips that already exist are skipped, so it is safe to run again.

Needs the GOOGLE_TTS_API_KEY environment variable. Never put the key in this file.
Optional: GOOGLE_TTS_VOICE (default en-US-Neural2-F), GOOGLE_TTS_RATE (default 0.9).
Use --redo to make every clip again (for example after changing the voice).
"""
import json, os, re, sys, time, base64, urllib.request, urllib.error

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sounds', 'tts')
KEY = os.environ.get('GOOGLE_TTS_API_KEY')
VOICE = os.environ.get('GOOGLE_TTS_VOICE', 'en-US-Neural2-F')
RATE = float(os.environ.get('GOOGLE_TTS_RATE', '0.9'))
REDO = '--redo' in sys.argv

def slug(t):  # must match slug() in index.html
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', t.lower()))

def synth(text):
    body = json.dumps({'input': {'text': text},
                       'voice': {'languageCode': VOICE[:5], 'name': VOICE},
                       'audioConfig': {'audioEncoding': 'MP3', 'speakingRate': RATE}}).encode()
    req = urllib.request.Request('https://texttospeech.googleapis.com/v1/text:synthesize',
                                 data=body, headers={'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return base64.b64decode(json.load(r)['audioContent'])

def main():
    if not KEY:
        sys.exit('Set GOOGLE_TTS_API_KEY first (see the instructions).')
    texts = json.load(open(os.path.join(HERE, 'texts.json'), encoding='utf-8'))
    made = failed = 0
    for t in texts:
        path = os.path.join(HERE, slug(t) + '.mp3')
        if os.path.exists(path) and not REDO:
            continue
        try:
            open(path, 'wb').write(synth(t)); made += 1
            print('made', slug(t))
        except urllib.error.HTTPError as e:
            failed += 1; print('FAILED', t, e.code, e.read().decode()[:200])
            if e.code in (400, 401, 403): sys.exit('Stopping: check the key, the voice name, and that the API is enabled.')
        time.sleep(0.05)
    have = sorted(f[:-4] for f in os.listdir(HERE) if f.endswith('.mp3'))
    json.dump(have, open(os.path.join(HERE, 'clips.json'), 'w'), separators=(',', ':'))
    print(f'Done: {made} new clips, {failed} failed, {len(have)} clips in total.')

main()
