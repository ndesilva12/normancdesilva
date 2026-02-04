import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Trigger sync script in background
    const syncScript = '/home/ubuntu/clawd/relationship-intel/api/sync-emails.js';
    
    execAsync(`node ${syncScript}`).catch(err => {
      console.error('Sync error:', err);
    });
    
    return NextResponse.json({
      message: 'Sync started',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
