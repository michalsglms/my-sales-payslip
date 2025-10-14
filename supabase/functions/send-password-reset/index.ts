import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink }: PasswordResetRequest = await req.json();

    console.log("Sending password reset email to:", email);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Sales Tracker <onboarding@resend.dev>",
        to: [email],
        subject: "איפוס סיסמה - Sales Tracker",
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; direction: rtl;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #333; text-align: center;">🔐 איפוס סיסמה</h1>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                שלום,
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                קיבלנו בקשה לאיפוס הסיסמה שלך במערכת Sales Tracker.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #0066cc; 
                          color: white; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          display: inline-block;
                          font-weight: bold;">
                  לחץ כאן לאיפוס הסיסמה
                </a>
              </div>
              
              <p style="color: #555; font-size: 14px; line-height: 1.6;">
                או העתק והדבק את הקישור הבא בדפדפן:
              </p>
              
              <p style="background-color: #f8f8f8; 
                        padding: 15px; 
                        border-radius: 5px; 
                        word-break: break-all; 
                        font-size: 12px; 
                        color: #666;">
                ${resetLink}
              </p>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
                אם לא ביקשת איפוס סיסמה, אפשר להתעלם ממייל זה.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                Sales Tracker - מערכת ניהול מכירות
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const result = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
