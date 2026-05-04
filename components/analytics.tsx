import type { SiteContentMap } from "@/lib/site-content";

interface AnalyticsProps {
  content: SiteContentMap;
}

function safeScriptString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/</g, "\\u003c");
}

export function Analytics({ content }: AnalyticsProps) {
  const gaId = (
    content.marketing_google_analytics_id ||
    content.analytics_google_id ||
    ""
  ).trim();
  const gtmId = (content.marketing_google_tag_manager_id || "").trim();
  const googleAdsId = (content.marketing_google_ads_id || "").trim();
  const metaPixelId = (
    content.marketing_meta_pixel_id ||
    content.analytics_meta_pixel_id ||
    ""
  ).trim();
  const safeGaId = safeScriptString(gaId);
  const safeGoogleAdsId = safeScriptString(googleAdsId);
  const safeMetaPixelId = safeScriptString(metaPixelId);

  return (
    <>
      {gtmId && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${safeScriptString(gtmId)}');
              `,
            }}
          />
        </>
      )}
      {gaId && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <script
            id="google-analytics"
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${safeGaId}');
              ${googleAdsId ? `gtag('config', '${safeGoogleAdsId}');` : ""}
            `,
            }}
          />
        </>
      )}
      {metaPixelId && (
        <>
          <script
            id="meta-pixel"
            dangerouslySetInnerHTML={{
              __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${safeMetaPixelId}');
              fbq('track', 'PageView');
            `,
            }}
          />
        </>
      )}
    </>
  );
}
