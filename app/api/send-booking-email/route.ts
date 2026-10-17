import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  console.log('📧 Email API called - START');
  
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const notificationEmail = process.env.BOOKING_NOTIFICATION_EMAIL;

    if (!gmailUser || !gmailAppPassword || !notificationEmail) {
      console.error('❌ Email not configured: set GMAIL_USER, GMAIL_APP_PASSWORD and BOOKING_NOTIFICATION_EMAIL');
      return NextResponse.json(
        { success: false, error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // 👇 SAARE PARAMETERS RECEIVE KARO
    const { 
      clientName, 
      clientEmail, 
      clientPhone, 
      serviceName, 
      bookingDate, 
      bookingTime, 
      message,
      bookingId,
      propertyType,
      area,
      frequency,
      staffName,      // YEH ANA CHAHIYE
      staffId,        // YEH BHI ANA CHAHIYE
      source
    } = body;

    // Debug logs
    console.log('📧 STAFF NAME RECEIVED:', staffName || '❌ NOT RECEIVED');
    console.log('📧 STAFF ID RECEIVED:', staffId || '❌ NOT RECEIVED');
    console.log('📧 SERVICE NAME:', serviceName);

    // Agar staffName nahi aya to selectedStaff try karo (backward compatibility)
    const finalStaffName = staffName || body.selectedStaff || 'Not assigned';
    const finalStaffId = staffId || body.staffId || '';

    console.log('📧 Final Staff Name for email:', finalStaffName);

    // ============= EMAIL AUTH =============
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    // ============= HTML CONTENT =============
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Notification - SilverMaid</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
          .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #eaeaea; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 30px; }
          .booking-id { background: #f3f4f6; padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; font-size: 18px; font-weight: 600; border-left: 4px solid #667eea; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: 600; color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 5px; }
          .value { font-size: 16px; color: #1f2937; font-weight: 500; background: #f9fafb; padding: 8px 12px; border-radius: 8px; }
          
          /* STAFF SECTION HIGHLIGHT */
          .staff-section {
            background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
            border: 2px solid #0284c7;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
          }
          .staff-name-large {
            font-size: 24px;
            font-weight: 800;
            color: #0369a1;
            margin: 10px 0;
          }
          .staff-badge {
            background: #0284c7;
            color: white;
            padding: 6px 16px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
          }
          .divider { height: 1px; background: #e5e7eb; margin: 25px 0; }
          .status-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 16px; border-radius: 30px; font-size: 14px; font-weight: 600; }
          .footer { text-align: center; padding: 25px; background: #f9fafb; color: #6b7280; font-size: 13px; border-top: 1px solid #eaeaea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ New Booking Received</h1>
          </div>
          <div class="content">
            <div class="booking-id">
              Booking ID: #${bookingId}
            </div>
            
            <div class="info-grid">
              <div class="field">
                <div class="label">👤 Client</div>
                <div class="value">${clientName}</div>
              </div>
              <div class="field">
                <div class="label">📞 Phone</div>
                <div class="value">${clientPhone}</div>
              </div>
            </div>
            
            <div class="field">
              <div class="label">📧 Email</div>
              <div class="value">${clientEmail}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="field">
              <div class="label">🔧 Service</div>
              <div class="value">${serviceName}</div>
            </div>
            
            <!-- 👇 STAFF SECTION - HIGHLIGHTED -->
            ${finalStaffName !== 'Not assigned' ? `
            <div class="staff-section">
              <div class="label" style="color: #0369a1;">👥 ASSIGNED PROFESSIONAL</div>
              <div class="staff-name-large">${finalStaffName}</div>
              ${finalStaffId ? `<p style="font-size: 14px; color: #0369a1; margin: 5px 0;">ID: ${finalStaffId.substring(0,8)}...</p>` : ''}
              <span class="staff-badge">⭐ Certified & Verified</span>
            </div>
            ` : `
            <div class="field">
              <div class="label">👥 Staff</div>
              <div class="value" style="color: #9ca3af; font-style: italic;">To be assigned</div>
            </div>
            `}
            
            <div class="info-grid">
              <div class="field">
                <div class="label">🏠 Property</div>
                <div class="value">${propertyType || 'Not specified'}</div>
              </div>
              <div class="field">
                <div class="label">📍 Location</div>
                <div class="value">${area || 'Not specified'}</div>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="field">
                <div class="label">🔄 Frequency</div>
                <div class="value">${frequency === 'once' ? 'One-Time' : frequency === 'weekly' ? 'Weekly' : 'Bi-Weekly'}</div>
              </div>
              <div class="field">
                <div class="label">📅 Date</div>
                <div class="value">${bookingDate}</div>
              </div>
            </div>
            
            <div class="field">
              <div class="label">⏰ Time</div>
              <div class="value">${bookingTime || 'Not specified'}</div>
            </div>
            
            ${message ? `
            <div class="divider"></div>
            <div class="field">
              <div class="label">📝 Notes</div>
              <div class="value">${message}</div>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 25px;">
              <span class="status-badge">⏳ PENDING</span>
            </div>
          </div>
          <div class="footer">
            <p>SilverMaid Booking System • notification@silvermaid.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"SilverMaid" <${gmailUser}>`,
      to: notificationEmail,
      subject: finalStaffName !== 'Not assigned' 
        ? `📋 ${clientName} - ${serviceName} (Staff: ${finalStaffName}) #${bookingId}`
        : `📋 ${clientName} - ${serviceName} #${bookingId}`,
      html: htmlContent,
      text: `Booking #${bookingId} - Staff: ${finalStaffName}`,
    };

    console.log('📧 SENDING EMAIL WITH STAFF:', finalStaffName);
    
    const info = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      staffName: finalStaffName 
    });

  } catch (error: any) {
    console.error('❌ ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}