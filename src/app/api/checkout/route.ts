import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { cvId } = await request.json().catch(() => ({}));

    if (!cvId) {
      return NextResponse.json({ error: 'cvId is required' }, { status: 400 });
    }

    // Generate a mock Stripe checkout URL associated with the cvId
    const checkoutUrl = `https://checkout.stripe.com/pay/cs_test_${cvId}_${Date.now()}`;

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
