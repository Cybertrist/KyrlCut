const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

// Configuration OAuth2
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

// Fonction pour créer le transporteur avec token d'accès
async function createTransporter() {
  try {
    const accessToken = await oauth2Client.getAccessToken();

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });
  } catch (error) {
    console.error('❌ Erreur création transporteur email:', error);
    throw error;
  }
}

/**
 * Envoie un email de confirmation de réservation
 */
async function sendReservationConfirmation(to, reservationDetails) {
  const { prestationNom, date, heureDebut, heureFin, lieu, prix } = reservationDetails;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: '✅ Confirmation de rendez-vous - Kyrl Cut',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0a0614 0%, #1a0f2e 100%);
            padding: 40px 20px;
            line-height: 1.6;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);
          }
          .header {
            background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: #ffffff;
            border-radius: 30px 30px 0 0;
          }
          .logo {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          }
          .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          }
          .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 16px;
            color: #374151;
            margin-bottom: 25px;
          }
          .card {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            border: 1px solid #e5e7eb;
          }
          .detail-item {
            display: flex;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .detail-item:first-child {
            padding-top: 0;
          }
          .icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            margin-right: 15px;
            flex-shrink: 0;
            text-align: center;
            line-height: 40px;
          }
          .detail-content {
            flex: 1;
          }
          .detail-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .detail-value {
            font-size: 16px;
            color: #111827;
            font-weight: 600;
          }
          .alert {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .alert-content {
            display: flex;
            align-items: start;
          }
          .alert-icon {
            font-size: 20px;
            margin-right: 12px;
            margin-top: 2px;
            display: inline-block;
            text-align: center;
            line-height: 1;
          }
          .alert-text {
            font-size: 14px;
            color: #78350f;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(139, 92, 246, 0.5);
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.8;
            margin-bottom: 10px;
          }
          .footer-links {
            margin-top: 15px;
          }
          .footer-link {
            color: #8b5cf6;
            text-decoration: none;
            font-size: 13px;
            margin: 0 10px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>Rendez-vous confirmé</h1>
            <p>Votre réservation a été enregistrée avec succès</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Bonjour,<br><br>
              Nous avons le plaisir de confirmer votre rendez-vous. Voici tous les détails :
            </div>
            
            <div class="card">
              <div class="detail-item">
                <div class="detail-content">
                  <div class="detail-label">Prestation</div>
                  <div class="detail-value">${prestationNom}</div>
                </div>
              </div>
              
              <div class="detail-item">
                <div class="detail-content">
                  <div class="detail-label">Date</div>
                  <div class="detail-value">${date}</div>
                </div>
              </div>
              
              <div class="detail-item">
                <div class="detail-content">
                  <div class="detail-label">Horaire</div>
                  <div class="detail-value">${heureDebut} - ${heureFin}</div>
                </div>
              </div>
              
              ${lieu ? `
              <div class="detail-item">
                <div class="detail-content">
                  <div class="detail-label">Lieu</div>
                  <div class="detail-value">${lieu}</div>
                </div>
              </div>
              ` : ''}
              
              <div class="detail-item">
                <div class="detail-content">
                  <div class="detail-label">Tarif</div>
                  <div class="detail-value">${prix} €</div>
                </div>
              </div>
            </div>
            
            <div class="alert">
              <div class="alert-content">
                <div class="alert-text">
                  <strong>Rappel important :</strong> Merci d'arriver quelques minutes en avance pour garantir le respect de l'horaire. En cas d'empêchement, pensez à annuler votre rendez-vous depuis votre espace personnel.
                </div>
              </div>
            </div>
            
            <div class="button-container">
              <a href="http://localhost:3000/profile.html" class="button">
                Gérer mes rendez-vous
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>
              <strong>Kyrl Cut - Coiffure</strong><br>
              Cet email a été envoyé automatiquement suite à votre réservation.
            </p>
            <p>
              Pour toute question, connectez-vous à votre espace personnel.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmation envoyé à:', to);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return false;
  }
}

/**
 * Envoie un email de rappel 24h avant le RDV
 */
async function sendReminder(to, reservationDetails) {
  const { prestationNom, date, heureDebut, lieu } = reservationDetails;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: '⏰ Rappel : Rendez-vous demain - Kyrl Cut',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0f0820;
            color: #fff;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a0f2e 0%, #2d1b4e 100%);
            border-radius: 16px;
            padding: 40px;
          }
          h1 {
            color: #c7b6e8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⏰ Rappel de rendez-vous</h1>
          <p style="color: #c7b6e8; line-height: 1.6; text-align: center;">
            Votre rendez-vous est demain !<br><br>
            <strong>${prestationNom}</strong><br>
            ${date} à ${heureDebut}<br>
            ${lieu ? `📍 ${lieu}` : ''}
          </p>
          <p style="color: #8a7a9e; font-size: 14px; text-align: center;">
            À bientôt ! 😊
          </p>
        </div>
      </body>
      </html>
    `
  };

  try {
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de rappel envoyé à:', to);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi rappel:', error);
    return false;
  }
}

/**
 * Envoie un email de confirmation d'annulation
 */
async function sendCancellationConfirmation(to, reservationDetails) {
  const { prestationNom, date, heureDebut, heureFin } = reservationDetails;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Rendez-vous annulé - Kyrl Cut',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0a0614 0%, #1a0f2e 100%);
            padding: 40px 20px;
            line-height: 1.6;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(255, 68, 68, 0.3);
          }
          .header {
            background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: #ffffff;
            border-radius: 30px 30px 0 0;
          }
          .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          }
          .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 16px;
            color: #374151;
            margin-bottom: 25px;
          }
          .card {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            border: 1px solid #fecaca;
          }
          .detail-item {
            display: flex;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #fecaca;
          }
          .detail-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .detail-item:first-child {
            padding-top: 0;
          }
          .detail-content {
            flex: 1;
          }
          .detail-label {
            font-size: 12px;
            color: #b91c1c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .detail-value {
            font-size: 16px;
            color: #991b1b;
            font-weight: 600;
          }
          .info-box {
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 16px 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .info-text {
            font-size: 14px;
            color: #1e3a8a;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(139, 92, 246, 0.5);
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.8;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>Rendez-vous annulé</h1>
            <p>Votre réservation a été annulée</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Bonjour,<br><br>
              Votre rendez-vous a été annulé. Voici les détails :
            </div>
            
            <div class="card">
              <div class="detail-item">
                <div class="detail-content">
                  <div class="detail-label">Prestation</div>
                  <div class="detail-value">${prestationNom}</div>
                </div>
              </div>
              
              <div class="detail-item">
                <div class="detail-content">
                  <div class="detail-label">Date</div>
                  <div class="detail-value">${date}</div>
                </div>
              </div>
              
              <div class="detail-item">
                <div class="detail-content">
                  <div class="detail-label">Horaire</div>
                  <div class="detail-value">${heureDebut} - ${heureFin}</div>
                </div>
              </div>
            </div>
            
            <div class="info-box">
              <div class="info-text">
                <strong>Besoin de reprendre rendez-vous ?</strong><br>
                Vous pouvez réserver un nouveau créneau à tout moment depuis votre espace personnel.
              </div>
            </div>
            
            <div class="button-container">
              <a href="http://localhost:3000/reservations.html" class="button">
                Prendre un nouveau rendez-vous
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>
              <strong>Kyrl Cut - Coiffure</strong><br>
              Cet email a été envoyé automatiquement suite à l'annulation de votre réservation.
            </p>
            <p>
              Pour toute question, connectez-vous à votre espace personnel.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    console.log('✅ Email d\'annulation envoyé à:', to);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email annulation:', error);
    return false;
  }
}

module.exports = {
  sendReservationConfirmation,
  sendReminder,
  sendCancellationConfirmation
};
