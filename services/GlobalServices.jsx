import axios from "axios"
import { CoachingOptions } from "./Options";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { ElevenLabsClient, play } from "elevenlabs";

export const getToken = async () => {
    const result = await axios.get('/api/getToken');
    return result.data
}

export const AIModel = async (topic, coachingOption, lastTwoConversation) => {
    try {
        console.log('🤖 Calling AI API:', { topic, coachingOption });
        
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic,
                coachingOption,
                lastTwoConversation
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'AI API call failed');
        }

        console.log('✅ AI response received');
        return data.response;

    } catch (error) {
        console.error('❌ Error calling AI API:', error);
        throw error;
    }
}

export const AIModelToGenerateFeedbackAndNotes = async (coachingOption, conversation) => {
    try {
        console.log('🤖 Calling AI Feedback API:', { coachingOption });
        
        const response = await fetch('/api/ai-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                coachingOption,
                conversation
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'AI Feedback API call failed');
        }

        console.log('✅ AI feedback response received');
        return data.response;

    } catch (error) {
        console.error('❌ Error calling AI Feedback API:', error);
        throw error;
    }
}

const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.NEXT_PUBLIC_ELEVENLAB_API_KEY,
});

export const ConvertTextToSpeech = async (text, expertName) => {
    const pollyClient = new PollyClient({
        region: 'us-east-1',
        credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECREAT_KEY
        }
    })

    const command = new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: expertName
    })

    try {
        const { AudioStream } = await pollyClient.send(command);

        const audioArrayBuffer = await AudioStream.transformToByteArray();
        const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/mp3' })

        const audioUrl = URL.createObjectURL(audioBlob);
        return audioUrl

    } catch (e) {
        console.log(e);
    }
}