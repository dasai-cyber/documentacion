import { NextRequest, NextResponse } from 'next/server';

const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8080';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: 'ID de archivo faltante' },
      { status: 400 }
    );
  }

  try {
    const workerRes = await fetch(`${WORKER_URL}/download/${id}`);

    if (!workerRes.ok) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'El archivo ha expirado o no existe' },
        { status: workerRes.status }
      );
    }

    const contentType = workerRes.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = workerRes.headers.get('content-disposition') || `attachment; filename="documento-comprimido"`;

    const blob = await workerRes.blob();

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (err: any) {
    console.error('Error proxying download:', err);
    return NextResponse.json(
      { error: 'DOWNLOAD_FAILED', message: 'No se pudo descargar el archivo' },
      { status: 500 }
    );
  }
}
