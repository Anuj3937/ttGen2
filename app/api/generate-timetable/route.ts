import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { subjects, divisions, faculty, rooms, constraints } = await request.json();

    // Create prompt for Gemini AI to optimize timetable
    const prompt = `
    You are a timetable optimization expert. Given the following data:
    
    Subjects: ${JSON.stringify(subjects, null, 2)}
    Divisions: ${JSON.stringify(divisions, null, 2)}
    Faculty: ${JSON.stringify(faculty, null, 2)}
    Rooms: ${JSON.stringify(rooms, null, 2)}
    
    Analyze this data and provide optimization suggestions for:
    1. Faculty workload distribution
    2. Room utilization patterns
    3. Potential scheduling conflicts
    4. Suggestions for better time slot allocation
    5. Recommendations for handling electives and minors
    
    Provide your response in JSON format with the following structure:
    {
      "workloadAnalysis": "...",
      "roomUtilization": "...",
      "conflictWarnings": ["..."],
      "suggestions": ["..."],
      "electiveRecommendations": "..."
    }
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(text.replace(/``````\n?/g, ''));
    } catch {
      analysis = {
        workloadAnalysis: text,
        suggestions: ['AI analysis completed'],
      };
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Gemini AI Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
