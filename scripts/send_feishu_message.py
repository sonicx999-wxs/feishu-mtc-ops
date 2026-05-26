#!/usr/bin/env python3
"""
飞书群聊消息发送脚本 - MTC模式专用
版本: 2.4.5
适用Skill: feishu-mtc-ops v2.4.5
使用方式: python3 send_feishu_message.py "群聊ID" "消息内容"
"""
import json
import urllib.request
import sys
import os


def load_credentials():
    """从MCP配置文件动态读取凭证"""
    config_path = "/data/user/mcp/mcp-servers.json"
    with open(config_path, 'r') as f:
        config = json.load(f)
    env = config.get("mcpServers", {}).get("lark-mcp", {}).get("env", {})
    app_id = env.get("APP_ID")
    app_secret = env.get("APP_SECRET")
    
    # 如果env字段不存在，尝试从旧版args参数读取
    if not app_id or not app_secret:
        args = config.get("mcpServers", {}).get("lark-mcp", {}).get("args", [])
        for i, arg in enumerate(args):
            if arg == "-a" and i + 1 < len(args):
                app_id = args[i + 1]
            elif arg == "-s" and i + 1 < len(args):
                app_secret = args[i + 1]
    
    if not app_id or not app_secret:
        raise Exception(f"凭证读取失败，请检查 {config_path}")
    return app_id, app_secret


def get_proxy():
    """从环境变量获取代理地址，带默认值"""
    return os.environ.get("HTTPS_PROXY", "http://127.0.0.1:18080")


def create_opener(proxy_url):
    """创建带代理的URL请求器"""
    proxy_handler = urllib.request.ProxyHandler({
        'https': proxy_url,
        'http': proxy_url
    })
    return urllib.request.build_opener(proxy_handler)


def get_tenant_token(app_id, app_secret, opener):
    """获取飞书tenant_access_token"""
    data = json.dumps({"app_id": app_id, "app_secret": app_secret}).encode()
    req = urllib.request.Request(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    resp = opener.open(req, timeout=30)
    result = json.loads(resp.read().decode())
    if result.get("code") != 0:
        raise Exception(f"获取token失败: code={result.get('code')}, msg={result.get('msg')}")
    return result.get("tenant_access_token")


def send_text_message(token, chat_id, text, opener):
    """发送文本消息到指定群聊"""
    content = json.dumps({"text": text})
    data = json.dumps({
        "receive_id": chat_id,
        "msg_type": "text",
        "content": content
    }).encode()
    req = urllib.request.Request(
        "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    resp = opener.open(req, timeout=30)
    return json.loads(resp.read().decode())


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: python3 send_feishu_message.py <群聊ID> <消息内容>")
        sys.exit(1)

    chat_id = sys.argv[1]
    message = sys.argv[2]

    try:
        app_id, app_secret = load_credentials()
        proxy = get_proxy()
        opener = create_opener(proxy)
        token = get_tenant_token(app_id, app_secret, opener)
        result = send_text_message(token, chat_id, message, opener)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"发送失败: {e}", file=sys.stderr)
        sys.exit(1)
