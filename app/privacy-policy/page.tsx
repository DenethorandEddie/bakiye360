"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
                Gizlilik Politikası
              </h1>
              <p className="text-xl text-muted-foreground">
                Bakiye360'ın kişisel verilerinizi nasıl topladığı, kullandığı ve koruduğuna dair açıklamalar.
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
                Bakiye360 ("biz", "bizim" veya "şirketimiz"), kişisel verilerinizin gizliliğine büyük önem vermektedir. 
                Bu Gizlilik Politikası, Bakiye360 web sitesini ve mobil uygulamasını (birlikte "Hizmet") kullandığınızda 
                kişisel verilerinizin nasıl toplandığını, kullanıldığını, paylaşıldığını ve korunduğunu açıklamaktadır.
              </p>
              <p>
                Hizmetimizi kullanarak, kişisel verilerinizin bu politikaya uygun olarak işlenmesini kabul etmiş olursunuz. 
                Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili diğer mevzuatla uyumludur.
              </p>

              <h2>2. Toplanan Veriler</h2>

              <h3>2.1 Doğrudan Sağladığınız Veriler</h3>
              <p>
                Bakiye360'a kaydolduğunuzda veya Hizmeti kullandığınızda, aşağıdaki kişisel verileri doğrudan bize sağlayabilirsiniz:
              </p>
              <ul>
                <li>İletişim bilgileri (ad, soyad, e-posta adresi, telefon numarası)</li>
                <li>Hesap bilgileri (kullanıcı adı, şifre)</li>
                <li>Finansal veriler (gelir, gider, bütçe bilgileri, finansal hedefler)</li>
                <li>Profil bilgileri (doğum tarihi, cinsiyet, meslek, eğitim düzeyi)</li>
                <li>Tercihler ve ilgi alanları</li>
                <li>Geri bildirimler ve destek talepleri</li>
              </ul>

              <h3>2.2 Otomatik Olarak Toplanan Veriler</h3>
              <p>
                Hizmeti kullandığınızda, aşağıdaki bilgiler otomatik olarak toplanabilir:
              </p>
              <ul>
                <li>Cihaz bilgileri (cihaz türü, işletim sistemi, tarayıcı tipi)</li>
                <li>IP adresi</li>
                <li>Hizmet kullanım bilgileri (oturum süresi, tıklama verileri, görüntülenen sayfalar)</li>
                <li>Konum verileri (eğer izin verirseniz)</li>
                <li>Çerezler ve benzer teknolojiler aracılığıyla toplanan veriler</li>
              </ul>

              <h3>2.3 Üçüncü Taraflardan Alınan Veriler</h3>
              <p>
                Aşağıdaki üçüncü taraf kaynaklardan da veri alabiliriz:
              </p>
              <ul>
                <li>İzniniz dahilinde bağladığınız banka hesapları ve finansal kurumlar</li>
                <li>Sosyal medya platformları (eğer sosyal medya hesabınızla giriş yaparsanız)</li>
                <li>Analitik sağlayıcılar ve reklam ağları</li>
                <li>İş ortaklarımız ve hizmet sağlayıcılarımız</li>
              </ul>

              <h2>3. Verilerin Kullanımı</h2>
              <p>
                Topladığımız kişisel verileri aşağıdaki amaçlar için kullanıyoruz:
              </p>

              <h3>3.1 Hizmetin Sağlanması ve Geliştirilmesi</h3>
              <ul>
                <li>Hesabınızı oluşturmak ve yönetmek</li>
                <li>Hizmeti sağlamak ve özelliklerini geliştirmek</li>
                <li>Kişiselleştirilmiş içerik ve öneriler sunmak</li>
                <li>Kullanıcı deneyimini iyileştirmek</li>
                <li>Müşteri desteği sağlamak</li>
                <li>Teknik sorunları gidermek</li>
              </ul>

              <h3>3.2 İletişim</h3>
              <ul>
                <li>Hizmet güncellemeleri, bildirimler ve önemli değişiklikler hakkında sizi bilgilendirmek</li>
                <li>Sorularınıza ve taleplerinize yanıt vermek</li>
                <li>İzniniz olması halinde pazarlama iletişimleri göndermek</li>
              </ul>

              <h3>3.3 Analiz ve İyileştirme</h3>
              <ul>
                <li>Hizmetin kullanımını analiz etmek</li>
                <li>Kullanıcı davranışlarını ve tercihlerini anlamak</li>
                <li>Hizmetin işlevselliğini ve performansını iyileştirmek</li>
                <li>Yeni özellikler ve hizmetler geliştirmek</li>
              </ul>

              <h3>3.4 Güvenlik ve Dolandırıcılığı Önleme</h3>
              <ul>
                <li>Hesabınızı ve verilerinizi korumak</li>
                <li>Dolandırıcılık ve diğer yasadışı faaliyetleri tespit etmek ve önlemek</li>
                <li>Şüpheli etkinlikleri izlemek</li>
              </ul>

              <h3>3.5 Yasal Yükümlülükler</h3>
              <ul>
                <li>Yasal yükümlülüklere uymak</li>
                <li>Yasal hakları korumak ve savunmak</li>
                <li>Yetkili kurumlardan gelen taleplere cevap vermek</li>
              </ul>

              <h2>4. Verilerin Paylaşımı</h2>
              <p>
                Kişisel verilerinizi aşağıdaki durumlar dışında üçüncü taraflarla paylaşmıyoruz:
              </p>

              <h3>4.1 Hizmet Sağlayıcılar</h3>
              <p>
                Hizmetimizi sağlamak ve geliştirmek için çalıştığımız üçüncü taraf hizmet sağlayıcılarla (örneğin, 
                bulut hizmetleri, ödeme işlemcileri, analitik sağlayıcılar) veri paylaşabiliriz. Bu hizmet sağlayıcılar, 
                verilerinizi sadece bizim talimatlarımız doğrultusunda işleme yetkisine sahiptir.
              </p>

              <h3>4.2 İzinli Paylaşım</h3>
              <p>
                Açık izniniz olduğunda kişisel verilerinizi paylaşabiliriz.
              </p>

              <h3>4.3 Yasal Gereklilikler</h3>
              <p>
                Yasal bir yükümlülüğe uymak, Bakiye360'ın haklarını veya mülkiyetini korumak, kullanıcılarımızın veya 
                üçüncü tarafların güvenliğini sağlamak ya da yasal bir soruşturma, mahkeme emri veya yasal süreci 
                yanıtlamak için kişisel verilerinizi paylaşabiliriz.
              </p>

              <h3>4.4 İş Transferleri</h3>
              <p>
                Birleşme, şirket satışı, varlıkların satışı veya benzer bir işlem durumunda, kişisel verileriniz 
                transfer edilen varlıklar arasında yer alabilir. Böyle bir durumda sizi bilgilendireceğiz.
              </p>

              <h3>4.5 Toplu ve Anonim Veriler</h3>
              <p>
                Toplu veya anonim hale getirilmiş verileri, sizi tanımlamak için kullanılamayacak şekilde üçüncü 
                taraflarla paylaşabiliriz.
              </p>

              <h2>5. Veri Güvenliği</h2>
              <p>
                Kişisel verilerinizin güvenliğini sağlamak için uygun teknik ve organizasyonel önlemler alıyoruz. 
                Bu önlemler arasında şunlar yer alır:
              </p>
              <ul>
                <li>Verilerin şifrelenmesi</li>
                <li>Güvenli sunucu altyapısı</li>
                <li>Düzenli güvenlik değerlendirmeleri</li>
                <li>Çalışanlar için veri koruma eğitimleri</li>
                <li>Erişim kontrolü ve yetkilendirme</li>
              </ul>
              <p>
                Ancak, hiçbir internet tabanlı hizmet veya veri iletim yöntemi %100 güvenli değildir. Bu nedenle, 
                kişisel verilerinizin mutlak güvenliğini garanti edemeyiz.
              </p>

              <h2>6. Veri Saklama</h2>
              <p>
                Kişisel verilerinizi, Hizmeti sağlamak için gerekli olduğu sürece veya hesabınız aktif olduğu sürece 
                saklarız. Verilerinizi ayrıca yasal yükümlülüklerimizi yerine getirmek, anlaşmazlıkları çözmek ve 
                politikalarımızı uygulamak için gerekli olduğu sürece saklayabiliriz.
              </p>
              <p>
                Hesabınızı sildiğinizde, kişisel verileriniz makul bir süre içinde sistemlerimizden silinecek veya 
                anonim hale getirilecektir. Ancak, yasal yükümlülüklerimizi yerine getirmek için bazı verileri daha 
                uzun süre saklayabiliriz.
              </p>

              <h2>7. Haklarınız</h2>
              <p>
                Kişisel verilerinizle ilgili olarak aşağıdaki haklara sahipsiniz:
              </p>
              <ul>
                <li>Verilerinize erişim talep etme</li>
                <li>Yanlış veya eksik verilerin düzeltilmesini talep etme</li>
                <li>Verilerinizin silinmesini talep etme (belirli koşullar altında)</li>
                <li>Veri işlememizi kısıtlamamızı talep etme</li>
                <li>Verilerinizin taşınabilirliğini talep etme</li>
                <li>Belirli durumlarda veri işlememize itiraz etme</li>
                <li>Önceden verilen izni geri çekme</li>
              </ul>
              <p>
                Bu haklarınızı kullanmak için, aşağıdaki "İletişim" bölümünde belirtilen yöntemlerle bize ulaşabilirsiniz. 
                Talebinizi aldıktan sonra, yasal gerekliliklere uygun olarak en kısa sürede yanıt vereceğiz.
              </p>
              <p>
                Ayrıca, kişisel verilerinizin işlenmesi konusunda bir endişeniz varsa, yerel veri koruma otoritenize 
                (Türkiye'de Kişisel Verileri Koruma Kurumu) şikayette bulunma hakkına sahipsiniz.
              </p>

              <h2>8. Çocukların Gizliliği</h2>
              <p>
                Hizmetimiz, 18 yaşın altındaki çocuklara yönelik değildir. 18 yaşın altındaki kişilerden bilerek 
                kişisel veri toplamıyoruz. Eğer 18 yaşın altında olduğunuzu düşündüğümüz birinden kişisel veri 
                topladığımızı fark edersek, bu verileri en kısa sürede silmek için adımlar atarız.
              </p>

              <h2>9. Uluslararası Veri Transferleri</h2>
              <p>
                Kişisel verileriniz, Türkiye dışındaki sunucularda saklanabilir ve işlenebilir. Bu durumda, verilerinizin 
                güvenliğini sağlamak için uygun önlemleri alacağız ve veri transferinin ilgili veri koruma kanunlarına 
                uygun olarak gerçekleşmesini sağlayacağız.
              </p>

              <h2>10. Çerezler ve Benzer Teknolojiler</h2>
              <p>
                Hizmetimizde çerezleri ve benzer teknolojileri kullanıyoruz. Çerezler hakkında daha fazla bilgi için 
                lütfen <Link href="/cookie-policy">Çerez Politikamızı</Link> inceleyin.
              </p>

              <h2>11. Politika Değişiklikleri</h2>
              <p>
                Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Herhangi bir değişiklik yaptığımızda, güncellenmiş 
                politikayı Hizmet üzerinde yayınlayacağız ve "Son güncelleme" tarihini değiştireceğiz. Önemli değişiklikler 
                olması durumunda, sizi e-posta yoluyla veya Hizmet üzerinde bir bildirim göstererek bilgilendireceğiz.
              </p>
              <p>
                Değişikliklerden sonra Hizmeti kullanmaya devam etmeniz, güncellenmiş Gizlilik Politikasını kabul ettiğiniz 
                anlamına gelir.
              </p>

              <h2>12. İletişim</h2>
              <p>
                Bu Gizlilik Politikası veya kişisel verilerinizin işlenmesi hakkında sorularınız, yorumlarınız veya 
                talepleriniz varsa, lütfen aşağıdaki iletişim bilgilerini kullanarak bizimle iletişime geçin:
              </p>
              <p>
                <strong>Bakiye360</strong><br />
                E-posta: privacy@bakiye360.com
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