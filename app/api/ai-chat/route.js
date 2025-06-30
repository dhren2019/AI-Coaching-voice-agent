import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CoachingOptions } from '@/services/Options';

// Configurar OpenAI en el servidor (más seguro)
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Coaching Voice Agent",
    }
});

export async function POST(req) {
    try {
        const { topic, coachingOption, lastTwoConversation } = await req.json();

        console.log('🤖 AI API called:', {
            topic,
            coachingOption,
            conversationLength: lastTwoConversation?.length || 0
        });

        // Debug environment variable
        console.log('🔑 OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY);
        console.log('🔑 OPENROUTER_API_KEY length:', process.env.OPENROUTER_API_KEY?.length || 0);

        if (!topic || !coachingOption) {
            return NextResponse.json({
                error: 'Topic and coaching option are required'
            }, { status: 400 });
        }

        // Buscar la opción de coaching
        const option = CoachingOptions.find((item) => item.name === coachingOption);
        
        if (!option) {
            return NextResponse.json({
                error: 'Coaching option not found'
            }, { status: 400 });
        }

        // Crear el prompt
        const PROMPT = option.prompt.replace('{user_topic}', topic);

        console.log('🔄 Calling OpenAI with prompt...');

        // Llamar a OpenAI
        const completion = await openai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [
                { role: 'assistant', content: PROMPT },
                ...(lastTwoConversation || [])
            ],
        });

        const aiResponse = completion.choices[0].message;

        console.log('✅ AI response received:', {
            role: aiResponse.role,
            contentLength: aiResponse.content?.length || 0
        });

        return NextResponse.json({
            success: true,
            response: aiResponse
        });

    } catch (error) {
        console.error('❌ Error in AI API:', error);
        
        return NextResponse.json({
            error: 'Failed to get AI response',
            details: error.message
        }, { status: 500 });
    }
}
