import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Générer un nom de fichier unique
        const originalName = file.name;
        const extension = originalName.split('.').pop();
        const fileName = `${uuidv4()}.${extension}`;

        // Chemin de stockage : public/uploads/
        const path = join(process.cwd(), 'public/uploads', fileName);

        // Écrire le fichier
        await writeFile(path, buffer);

        // Retourner l'URL relative
        const url = `/uploads/${fileName}`;

        return NextResponse.json({
            success: true,
            url,
            name: originalName,
            size: file.size,
            type: file.type
        });
    } catch (error) {
        console.error('[API Upload] Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
