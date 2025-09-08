
import axios from 'axios';

const API_BASE_URL = 'https://api.appmax.com.br/v3';

const appmaxApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'access-token': process.env.APPMAX_API_KEY,
  },
});

interface Customer {
  name: string;
  email: string;
  cpf_cnpj: string;
  postal_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
}

interface Product {
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

interface Order {
  customer: Customer;
  products: Product[];
  shipping: number;
  discount: number;
  total: number;
}

export const createAppmaxPixPayment = async (order: Order) => {
  try {
    const response = await appmaxApi.post('/order', {
      ...order,
      payment_type: 'pix',
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Appmax PIX payment:', error);
    throw error;
  }
};

export const createAppmaxCreditCardPayment = async (order: Order, card: any) => {
  try {
    const response = await appmaxApi.post('/order', {
      ...order,
      payment_type: 'credit_card',
      card,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Appmax Credit Card payment:', error);
    throw error;
  }
};
