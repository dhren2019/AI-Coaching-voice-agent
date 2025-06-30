import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request) {
    try {
        const { coachingOption, conversation } = await request.json();

        if (!coachingOption || !conversation) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        console.log('🤖 Generating AI feedback for:', coachingOption.title);

        const prompt = `You are an expert ${coachingOption.title} coach. Based on the following conversation, provide detailed feedback and notes to help the person improve.

Coaching Area: ${coachingOption.title}
Description: ${coachingOption.description}

Conversation:
${conversation.map((msg, index) => `${index % 2 === 0 ? 'Coach' : 'User'}: ${msg}`).join('\n')}

Please provide:
1. Detailed feedback on the user's responses and engagement
2. Areas for improvement
3. Specific action items or next steps
4. Positive reinforcement for what they did well

Keep the feedback constructive, encouraging, and actionable.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a professional coach providing detailed feedback and notes based on coaching conversations. Your feedback should be constructive, specific, and actionable."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.7,
        });

        const response = completion.choices[0].message.content;
        console.log('✅ AI feedback generated successfully');

        return NextResponse.json({
            success: true,
            response: response
        });

    } catch (error) {
        console.error('❌ Error generating AI feedback:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to generate AI feedback' 
            },
            { status: 500 }
        );
    }
}
