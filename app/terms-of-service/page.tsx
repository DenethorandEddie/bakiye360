"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
                Kullanım Şartları
              </h1>
              <p className="text-xl text-muted-foreground">
                Bakiye360 hizmetlerini kullanırken uymanız gereken kurallar ve koşullar.
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
              <h2>1. Giriş</h2>
              <p>
                Bakiye360 hizmetlerine hoş geldiniz. Bakiye360 web sitesini ve mobil uygulamasını (birlikte "Hizmet") 
                kullanarak, bu Kullanım Şartları'nı kabul etmiş olursunuz. Lütfen bu şartları dikkatlice okuyun.
              </p>
              <p>
                Bu Kullanım Şartları, sizinle Bakiye360 arasında yasal olarak bağlayıcı bir anlaşmadır. Bu şartları 
                kabul etmiyorsanız, lütfen Hizmeti kullanmayın.
              </p>

              <h2>2. Hesap Oluşturma</h2>
              <p>
                Hizmetimizin bazı özelliklerini kullanabilmek için bir hesap oluşturmanız gerekebilir. Hesap oluştururken, 
                doğru, eksiksiz ve güncel bilgiler sağlamayı kabul edersiniz. Hesabınızın güvenliğinin sağlanması sizin 
                sorumluluğunuzdadır ve hesabınızla ilgili tüm etkinliklerden siz sorumlusunuz.
              </p>

              <h2>3. Hizmet Kullanımı</h2>
              <h3>3.1 Kullanım İzni</h3>
              <p>
                Bakiye360, bu şartlara tabi olarak, Hizmeti kişisel ve ticari olmayan amaçlarla kullanmanız için size 
                sınırlı, münhasır olmayan, devredilemez, geri alınabilir bir lisans verir.
              </p>

              <h3>3.2 Kullanım Kısıtlamaları</h3>
              <p>
                Hizmeti kullanırken aşağıdakileri yapmamayı kabul edersiniz:
              </p>
              <ul>
                <li>Hizmeti yasalara veya düzenlemelere aykırı bir şekilde kullanmak</li>
                <li>Bakiye360'ın açık yazılı izni olmadan Hizmeti ticari amaçlar için kullanmak</li>
                <li>Hizmeti başka kullanıcıları taciz etmek, kişisel haklarını ihlal etmek, zarar vermek veya rahatsız etmek için kullanmak</li>
                <li>Hizmetin normal işleyişini engellemeye çalışmak veya engellemek</li>
                <li>Hizmete yetkisiz erişim sağlamaya çalışmak</li>
                <li>Bakiye360'ın sistemlerine veya ağlarına zarar verebilecek virüsler veya zararlı kod yaymak</li>
                <li>İçeriği çoğaltmak, kopyalamak veya tekrar satmak</li>
              </ul>

              <h2>4. Fikri Mülkiyet Hakları</h2>
              <p>
                Hizmetin tasarımı, metinleri, görselleri, logoları, simgeleri, yazılımı ve diğer içeriği Bakiye360'ın 
                mülkiyetindedir veya Bakiye360'a lisanslanmıştır ve telif hakkı, ticari marka ve diğer fikri mülkiyet 
                yasaları tarafından korunmaktadır. Bakiye360'ın açık yazılı izni olmadan bu içeriği kopyalayamaz, 
                değiştiremez, dağıtamaz veya başka bir şekilde kullanamaz veya gösteremezsiniz.
              </p>

              <h2>5. Kullanıcı İçeriği</h2>
              <p>
                Hizmete içerik (örneğin, veriler, metin, resimler) gönderdiğinizde veya yüklediğinizde, bu içeriğin 
                mülkiyeti size ait olmaya devam eder. Ancak, Bakiye360'a ve ortaklarına bu içeriği Hizmeti sağlamak ve 
                geliştirmek için kullanma, değiştirme, dağıtma ve görüntüleme hakkı verirsiniz.
              </p>
              <p>
                Gönderdiğiniz veya yüklediğiniz içeriğin:
              </p>
              <ul>
                <li>Doğru ve yanıltıcı olmadığını</li>
                <li>Yasalara, düzenlemelere veya üçüncü taraf haklarına aykırı olmadığını</li>
                <li>Zararlı, tehdit edici, taciz edici, iftira niteliğinde, müstehcen veya başka bir şekilde sakıncalı olmadığını</li>
                <li>Virüs, kötü amaçlı yazılım veya diğer zararlı kod içermediğini</li>
              </ul>
              <p>
                beyan ve garanti edersiniz.
              </p>

              <h2>6. Feragatname ve Sorumluluk Sınırlaması</h2>
              <h3>6.1 Hizmet "OLDUĞU GİBİ" Sunulur</h3>
              <p>
                Hizmet, "olduğu gibi" ve "mevcut olduğu şekliyle" sunulmaktadır. Bakiye360, Hizmetin kesintisiz, 
                zamanında, güvenli veya hatasız olacağını garanti etmez.
              </p>

              <h3>6.2 Sorumluluk Sınırlaması</h3>
              <p>
                Hiçbir durumda Bakiye360, kar kaybı, veri kaybı veya diğer özel, dolaylı, arızi veya cezai zararlar 
                dahil olmak üzere herhangi bir dolaylı zarardan sorumlu olmayacaktır. Bakiye360'ın toplam sorumluluğu, 
                hizmet için ödediğiniz tutarı aşmayacaktır.
              </p>

              <h2>7. Ücretler ve Abonelikler</h2>
              <p>
                Bakiye360'ın bazı özellikleri ücretlidir. Ücretli özellikleri kullanmak için abone olduğunuzda, ödeme 
                bilgilerinizin doğru ve tam olduğunu ve bu bilgileri güncel tutacağınızı kabul edersiniz. Bakiye360 
                abone olma, aboneliği yenileme ve iptali ile ilgili süreçleri ve ücretleri önceden bildirimde bulunarak 
                değiştirebilir.
              </p>

              <h2>8. Şartların Değiştirilmesi</h2>
              <p>
                Bakiye360, bu Kullanım Şartları'nı zaman zaman değiştirebilir. Değişiklikler, Hizmette yayınlandığında 
                veya size e-posta ile bildirildiğinde yürürlüğe girer. Değişikliklerden sonra Hizmeti kullanmaya devam 
                etmeniz, güncellenmiş Kullanım Şartları'nı kabul ettiğiniz anlamına gelir.
              </p>

              <h2>9. Hesap Feshi</h2>
              <p>
                Bakiye360, yasalarla düzenlenen promosyon dönemleri hariç olmak üzere, herhangi bir nedenle herhangi bir 
                zamanda hesabınızı feshetme hakkını saklı tutar. Bakiye360 ayrıca bu Kullanım Şartları'nı ihlal etmeniz 
                durumunda hesabınızı feshedebilir.
              </p>

              <h2>10. Tazminat</h2>
              <p>
                Bu Kullanım Şartları'nı ihlal etmeniz, katkıda bulunduğunuz içeriğin üçüncü taraf haklarını ihlal 
                etmesi veya Hizmeti yanlış kullanmanız nedeniyle oluşabilecek her türlü talep, dava, sorumluluk, zarar 
                veya masraflara karşı Bakiye360'ı tazmin etmeyi kabul edersiniz.
              </p>

              <h2>11. Genel Hükümler</h2>
              <h3>11.1 Bölünebilirlik</h3>
              <p>
                Bu Kullanım Şartları'nın herhangi bir hükmünün geçersiz veya uygulanamaz olduğu tespit edilirse, 
                söz konusu hüküm en az gerekli ölçüde sınırlandırılacak veya ayrılacak, kalan hükümler ise tam olarak 
                yürürlükte kalmaya devam edecektir.
              </p>

              <h3>11.2 Feragat Yok</h3>
              <p>
                Bakiye360'ın bu Kullanım Şartları'nın herhangi bir hükmünü uygulamadaki başarısızlığı, söz konusu hükümden 
                veya Kullanım Şartları'nın diğer hükümlerinden feragat olarak yorumlanmamalıdır.
              </p>

              <h3>11.3 Uygulanacak Hukuk</h3>
              <p>
                Bu Kullanım Şartları, Türkiye Cumhuriyeti kanunlarına tabidir ve bu kanunlara göre yorumlanacaktır. 
                Bu Kullanım Şartları'ndan kaynaklanan herhangi bir anlaşmazlık Türkiye Cumhuriyeti mahkemelerinde 
                çözülecektir.
              </p>

              <h2>12. İletişim</h2>
              <p>
                Bu Kullanım Şartları hakkında sorularınız veya endişeleriniz varsa, lütfen aşağıdaki 
                adres üzerinden bizimle iletişime geçin:
              </p>
              <p>
                <strong>Bakiye360</strong><br />
                E-posta: terms@bakiye360.com
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