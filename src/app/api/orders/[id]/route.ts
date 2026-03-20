import { NextResponse } from 'next/server'

export async function PUT() {
  return NextResponse.json({ message: 'Orders are managed externally' })
}
