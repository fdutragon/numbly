
import { NextRequest, NextResponse } from 'next/server';
import {
  createAppmaxPixPayment,
  createAppmaxCreditCardPayment,
} from '@/lib/appmax';

export async function POST(req: NextRequest) {
  try {
    const { order, paymentType, card } = await req.json();

    if (!order || !paymentType) {
      return NextResponse.json(
        { error: 'Missing order or paymentType' },
        { status: 400 }
      );
    }

    // As per your request, we are not collecting address and using a fixed phone number.
    // However, most Brazilian payment gateways require a CPF/CNPJ.
    // I've added a placeholder for it.
    const customerWithDefaults = {
      ...order.customer,
      phone: '11999999999',
      postal_code: '00000-000',
      street: 'N/A',
      number: 'N/A',
      neighborhood: 'N/A',
      city: 'N/A',
      state: 'N/A',
      cpf_cnpj: order.customer.cpf_cnpj || '000.000.000-00', // Placeholder
    };

    const orderWithDefaults = {
        ...order,
        customer: customerWithDefaults,
    };

    let response;
    if (paymentType === 'pix') {
      response = await createAppmaxPixPayment(orderWithDefaults);
    } else if (paymentType === 'credit_card') {
      if (!card) {
        return NextResponse.json(
          { error: 'Missing card details' },
          { status: 400 }
        );
      }
      response = await createAppmaxCreditCardPayment(orderWithDefaults, card);
    } else {
      return NextResponse.json(
        { error: 'Invalid paymentType' },
        { status: 400 }
      );
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
