import { Session } from './types'

export const sessions: Session[] = [
    {
        "id": "1bc7094f-1248-4b51-8ac8-180a5a1470aa",
        "model": "gpt-3.5-turbo",
        "name": "Random Talk",
        "messages": [
            {
                "id": "9acc4bde-3510-41fd-b872-666547b8023e",
                "content": "hi",
                "format":'markdown',
                "createImg":false,
                "role": "user"
            },
            {
                "id": "fca70e6f-e8df-401a-8c20-7de068e931b5",
                "content": "Hello! How can I assist you today?",
                "format":'markdown',
                "createImg":false,
                "role": "assistant"
            }
        ]
    }
]