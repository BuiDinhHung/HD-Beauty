import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { encryptPassword } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    // Verify caller is super_admin via their ID token
    const authorization = req.headers.get('authorization') ?? '';
    const idToken = authorization.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const callerDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { uid, newPassword } = await req.json() as { uid: string; newPassword: string };
    if (!uid || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    // Update Firebase Auth password
    await adminAuth.updateUser(uid, { password: newPassword });

    // Update encrypted password in Firestore
    const encPwd = await encryptPassword(newPassword);
    await adminDb.collection('users').doc(uid).update({ encryptedPassword: encPwd });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
