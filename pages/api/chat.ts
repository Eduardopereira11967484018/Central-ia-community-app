// API endpoint para processamento de mensagens e integração com Gemini 1.5
// Armazena mensagens no banco e obtém respostas do Gemini
import { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Inicializa o cliente do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createServerClient()

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { message, communityId, userId } = req.body

    // Armazena mensagem do usuário no banco
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        content: message,
        user_id: userId,
        community_id: communityId,
        is_ai: false
      })
      .select()
      .single()

    if (messageError) {
      throw messageError
    }

    // Integração com Gemini 1.5 para gerar resposta
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Você é um assistente de comunidade. Mantenha as respostas concisas e amigáveis.' }],
        },
        {
          role: 'model',
          parts: [{ text: 'Entendi! Estou aqui para ajudar a comunidade de forma amigável e objetiva.' }],
        },
      ],
    })

    const result = await chat.sendMessage(message)
    const response = await result.response
    const aiMessage = response.text()

    // Armazena resposta do Gemini no banco
    const { data: aiMessageData, error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        content: aiMessage,
        user_id: userId,
        community_id: communityId,
        is_ai: true
      })
      .select()
      .single()

    if (aiMessageError) {
      throw aiMessageError
    }

    return res.status(200).json({ message: aiMessage })
  } catch (error) {
    console.error('Error in chat API:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}