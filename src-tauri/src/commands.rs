use serde::{Deserialize, Serialize};
use tauri::State;
use parking_lot::Mutex;
use crate::ChatClient;
use serde_json;

#[derive(Serialize, Deserialize, Debug)]
struct Message {
    role: String,
    content: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct ChatRequest {
    messages: Vec<Message>,
}

#[derive(Serialize, Deserialize, Debug)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Choice {
    message: Message,
}

const API_URL: &str = "https://new.wei.bi/";
const API_KEY: &str = "sk-DW85c4MRi0VYKS8IW1GhaJZvn6HPZmcd558unQiDD1BjgC4f";

#[tauri::command]
pub async fn send_message(
    message: String,
    chat_client: State<'_, Mutex<ChatClient>>,
) -> Result<String, String> {
    let client = chat_client.lock().client.clone();
    
    let request = ChatRequest {
        messages: vec![Message {
            role: "user".to_string(),
            content: message,
        }],
    };

    // 打印请求信息
    println!("Sending request to {}", API_URL);
    println!("Request body: {}", serde_json::to_string(&request).unwrap());

    let response = client
        .post(API_URL)
        .header("Authorization", format!("Bearer {}", API_KEY))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    // 打印响应状态
    println!("Response status: {}", response.status());

    // 获取响应文本
    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to get response text: {}", e))?;

    // 打印响应内容
    println!("Response body: {}", response_text);

    // 尝试解析 JSON
    let chat_response: ChatResponse = serde_json::from_str(&response_text)
        .map_err(|e| format!("Failed to parse response JSON: {}\nResponse text: {}", e, response_text))?;

    if let Some(choice) = chat_response.choices.first() {
        Ok(choice.message.content.clone())
    } else {
        Err("No response from API".to_string())
    }
} 