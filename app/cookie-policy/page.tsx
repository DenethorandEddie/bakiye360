"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicyPage() {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("light");

  useEffect(() => {
    setCurrentTheme(theme === "system" ? "light" : theme || "light");
  }, [theme]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center">
            <Image 
              src={currentTheme === "dark" ? "/logo_dark.png" : "/logo.png"} 
              alt="Bakiye360 Logo" 
              width={110} 
              height={28} 
              className="h-auto"
              priority
            />
          </Link>
          <div className="ml-auto flex items-center space-x-4">
            <Link 
              href="/" 
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/50">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">
                Çerez Politikası
              </h1>
              <p className="text-xl text-muted-foreground">
                Bakiye360'ın web sitesinde ve mobil uygulamasında çerezlerin nasıl kullanıldığına dair açıklamalar.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Son güncelleme: {new Date().toLocaleDateString('tr-TR', {day: 'numeric', month: 'long', year: 'numeric'})}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 bg-background">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
              <h2>1. Çerezler Hakkında</h2>
              <p>
                Çerezler, web sitelerine göz attığınızda bilgisayarınıza, tablet cihazınıza veya mobil cihazınıza 
                kaydedilen küçük metin dosyalarıdır. Bu metin dosyaları, web sitesinin veya mobil uygulamanın sizin 
                hakkınızda bilgi hatırlamasını sağlar. Böylece, bir sonraki ziyaretinizde deneyiminizi iyileştirmek 
                ve web sitesini veya mobil uygulamayı sizin için daha kullanışlı hale getirmek için kullanılır.
              </p>

              <h2>2. Bakiye360 Tarafından Kullanılan Çerezler</h2>
              <p>
                Bakiye360, web sitesinde ve mobil uygulamasında aşağıdaki çerez türlerini kullanmaktadır:
              </p>

              <h3>2.1 Kesinlikle Gerekli Çerezler</h3>
              <p>
                Bu çerezler, web sitesinin çalışması için gereklidir ve sistemlerimizde kapatılamazlar. Bunlar genellikle 
                gizlilik ayarlarınız, oturum açma bilgileriniz veya form doldurma işlemleriniz gibi 
                hizmetleri talep ettiğinizde ayarlanır. Tarayıcınızı bu çerezleri engelleyecek şekilde ayarlayabilirsiniz, 
                ancak bu durumda sitenin bazı bölümleri çalışmayabilir.
              </p>

              <h3>2.2 Performans Çerezleri</h3>
              <p>
                Bu çerezler, ziyaretçilerin web sitesini nasıl kullandığına dair bilgi toplamamıza olanak tanır. 
                Örneğin, hangi sayfaların en çok ziyaret edildiğini ve hangi sayfalardan hata mesajları alındığını 
                belirlemek için kullanılır. Bu çerezler, ziyaretçilerin web sitesinde nasıl gezindiği hakkında 
                istatistikler toplamamıza ve sitemizin performansını izlememize yardımcı olur. Bu çerezler sizi 
                kişisel olarak tanımlamaz.
              </p>

              <h3>2.3 İşlevsellik Çerezleri</h3>
              <p>
                Bu çerezler, web sitesinin tercihlerinizi hatırlamasını sağlar. Bunlar, dil tercihiniz veya 
                bulunduğunuz bölge gibi web sitesinin görünümünü veya davranışını kişiselleştiren ayarları 
                hatırlamak için kullanılır. Bu çerezlerin topladığı bilgiler anonim olabilir ve diğer web 
                sitelerindeki tarama etkinliğinizi takip edemezler.
              </p>

              <h3>2.4 Hedefleme/Reklam Çerezleri</h3>
              <p>
                Bu çerezler, ilgi alanlarınızı ve tarama alışkanlıklarınızı hatırlamak için kullanılır. 
                Bu çerezler, size ve ilgi alanlarınıza daha uygun reklamlar göstermemize yardımcı olur. 
                Ayrıca, aynı reklamı kaç kez gördüğünüzü sınırlamak ve reklamların ne kadar etkili olduğunu 
                ölçmek için de kullanılır. Genellikle, reklam veren networkler tarafından bizim izinimizle 
                yerleştirilirler.
              </p>

              <h2>3. Üçüncü Taraf Çerezleri</h2>
              <p>
                Bakiye360 web sitesini ve mobil uygulamasını ziyaret ettiğinizde, bazı çerezler bizim 
                tarafımızdan değil, üçüncü taraflarca yerleştirilebilir. Bu üçüncü taraflar arasında analitik 
                sağlayıcılar, ödeme işlemcileri ve sosyal medya platformları yer alabilir. Bu çerezlerin 
                amacı, bu üçüncü tarafların kendi gizlilik politikalarında açıklanmıştır.
              </p>

              <h3>3.1 Üçüncü Taraf Hizmetleri</h3>
              <p>
                Bakiye360, aşağıdaki üçüncü taraf hizmetlerini kullanabilir ve bu hizmetler kendi çerezlerini 
                yerleştirebilir:
              </p>
              <ul>
                <li>Google Analytics: Kullanıcı davranışını analiz etmek için.</li>
                <li>Google reCAPTCHA: Spam ve kötüye kullanımı önlemek için.</li>
                <li>Stripe/PayPal: Ödeme işlemleri için.</li>
                <li>Facebook/Twitter/LinkedIn: Sosyal medya özellikleri ve paylaşım butonları için.</li>
              </ul>

              <h2>4. Çerezleri Nasıl Kontrol Edebilirsiniz</h2>
              <p>
                Çoğu web tarayıcısı, çerezlerin kullanımını kontrol etmenize olanak tanır. Aşağıdaki 
                yöntemlerle çerezleri kontrol edebilirsiniz:
              </p>

              <h3>4.1 Tarayıcı Ayarları</h3>
              <p>
                Tarayıcı ayarlarınızı değiştirerek çerezleri kabul etmeyi veya reddetmeyi seçebilirsiniz. 
                Çoğu tarayıcı, çerezleri otomatik olarak kabul eder, ancak genellikle bu ayarı değiştirerek 
                çerezleri reddedebilirsiniz. Bunu nasıl yapabileceğinize dair talimatlar için tarayıcınızın 
                yardım bölümüne bakın.
              </p>

              <h3>4.2 Çerez Yönetimi Araçları</h3>
              <p>
                Bazı üçüncü taraf çerez yönetimi araçları, web sitelerinin çerez kullanımını daha detaylı 
                bir şekilde kontrol etmenize olanak tanır.
              </p>

              <h3>4.3 Opt-Out Mekanizmaları</h3>
              <p>
                Birçok üçüncü taraf reklam ağı, çerezler aracılığıyla kişiselleştirilmiş reklamlar sunmak için 
                bilgi toplar. Bu ağların çoğu, davranışsal reklamcılıktan çıkmanızı sağlayan bir mekanizma sunar. 
                Daha fazla bilgi ve çıkış seçenekleri için <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">buraya</a> tıklayabilirsiniz.
              </p>

              <h2>5. Çerezleri Reddetme veya Devre Dışı Bırakma</h2>
              <p>
                Çerezleri reddetmeyi veya devre dışı bırakmayı seçerseniz, Bakiye360 web sitesinin veya mobil 
                uygulamasının bazı özelliklerini tam olarak kullanamayabilirsiniz. Örneğin, oturum açma gerektiren 
                hizmetlere erişemeyebilir veya kişiselleştirilmiş içerik göremeyebilirsiniz.
              </p>

              <h2>6. Veri Koruma ve Gizlilik</h2>
              <p>
                Çerezler aracılığıyla toplanan bilgiler, <Link href="/privacy-policy">Gizlilik Politikamıza</Link> 
                uygun olarak işlenir ve korunur. Bakiye360, çerezler aracılığıyla toplanan kişisel verileri, 
                yürürlükteki veri koruma kanunlarına uygun olarak işler.
              </p>

              <h2>7. Çerez Politikasındaki Değişiklikler</h2>
              <p>
                Bakiye360, bu Çerez Politikasını dilediği zaman değiştirebilir. Politikadaki önemli değişiklikler, 
                web sitesinde veya mobil uygulamada belirgin bir bildirim ile duyurulacaktır. Bu politikayı 
                düzenli olarak gözden geçirmenizi öneririz.
              </p>

              <h2>8. İletişim</h2>
              <p>
                Bu Çerez Politikası hakkında sorularınız veya yorumlarınız varsa, lütfen aşağıdaki adres 
                üzerinden bizimle iletişime geçin:
              </p>
              <p>
                <strong>Bakiye360</strong><br />
                E-posta: cookies@bakiye360.com
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
            <div className="flex items-center">
              <Image 
                src={currentTheme === "dark" ? "/logo_dark.png" : "/logo.png"} 
                alt="Bakiye360 Logo" 
                width={110} 
                height={28} 
                className="h-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              &copy; {new Date().getFullYear()} Bakiye360. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 