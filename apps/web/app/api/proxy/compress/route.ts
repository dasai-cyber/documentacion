import { NextRequest, NextResponse } from 'next/server';

const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8080';
const WORKER_TOKEN = process.env.WORKER_TOKEN || 'development-secret-token';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const level = (formData.get('level') as string) || 'balanced';

    if (!file) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'No se envió ningún archivo.' },
        { status: 400 }
      );
    }

    const workerFormData = new FormData();
    workerFormData.append('file', file, file.name);
    workerFormData.append('level', level);

    let workerRes: Response;
    try {
      workerRes = await fetch(`${WORKER_URL}/compress`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WORKER_TOKEN}`,
        },
        body: workerFormData,
      });
    } catch (networkError: any) {
      console.error('Failed to reach worker backend:', networkError.message);
      return NextResponse.json(
        {
          error: 'WORKER_UNAVAILABLE',
          message:
            'El servidor de compresión de documentos no está disponible en este momento. Por favor verifica que el worker esté activo.',
        },
        { status: 503 }
      );
    }

    const data = await workerRes.json();

    if (!workerRes.ok) {
      return NextResponse.json(data, { status: workerRes.status });
    }

    // Rewrite downloadUrl to use the Next.js proxy route
    if (data.id) {
      data.downloadUrl = `/api/proxy/download/${data.id}`;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in proxy compress route:', error);
    return NextResponse.json(
      { error: 'PROXY_ERROR', message: error.message || 'Error interno en el proxy de compresión' },
      { status: 500 }
    );
  }
}
