import requests
import json


def main():
    url = "https://qianfan.baidubce.com/v2/app/conversation"
    
    payload = json.dumps({
        "app_id": "ac6acc7c-9e7c-4909-8bc0-5ca667a5e0b6"
    }, ensure_ascii=False)
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer bce-v3/ALTAK-1oMR2qNcjrYEgFF5lwRuf/57a449fdca9e46e5b3cfc1c7867ddfed59c08558'
    }
    
    response = requests.request("POST", url, headers=headers, data=payload.encode("utf-8"))
    
    print("状态码:", response.status_code)
    print("响应内容:", response.text)
    

if __name__ == '__main__':
    main() 