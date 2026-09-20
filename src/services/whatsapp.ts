import { Student } from '../types';

export function generateWhatsAppMessage(student: Student, appUrl?: string): string {
  const url = appUrl || window.location.origin;

  const text = `*Student Safety & Tracking Portal - Login Credentials*
----------------------------------------
Namaste *${student.parentName}* ji,

Aapke bachche ka Smart Student Tracking ID Card register ho gaya hai:

• *Student Name:* ${student.fullName}
• *Class:* ${student.studentClass}
• *Roll Number:* ${student.rollNumber}
• *Student ID:* ${student.studentId}
• *Emergency Contact:* ${student.emergencyContact}

----------------------------------------
*Parent Portal Login Details:*
• *Portal Link:* ${url}
• *Parent User ID:* ${student.parentLoginId}
• *Password:* ${student.parentPassword}
----------------------------------------

*Daily Tracking Guidelines:*
1. Bachcha ghar se nikalte waqt portal me QR scan karein ("Ghar se nikal chuka hai").
2. School Gate & Class me live automatic scan notification milegi.
3. Chhutti par live exit alert aayega aur ghar pahunchne par final scan karein.

Suraksha aur live update ke liye portal me login karein.`;

  return text;
}

export function openWhatsAppShare(student: Student, appUrl?: string): void {
  // Clean phone number: remove spaces, dashes, parentheses
  let phone = student.parentPhone.replace(/[^0-9+]/g, '');
  if (phone.startsWith('+')) {
    phone = phone.substring(1);
  } else if (phone.length === 10) {
    // Default to Indian country code +91
    phone = '91' + phone;
  }

  const message = generateWhatsAppMessage(student, appUrl);
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phone}?text=${encodedText}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
}
