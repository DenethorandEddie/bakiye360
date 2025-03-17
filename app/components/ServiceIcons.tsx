import { LucideProps } from "lucide-react";
import { Tv, Music2, Video, CreditCard, Car, Bus, Train, Bike, Home, Wrench as Tool, Wrench, Gamepad2, BookOpen, Dumbbell, Heart, Coffee, ShoppingBag, PiggyBank, Briefcase, GraduationCap, Calendar, Gift, Package, Wifi, Phone, Zap, Droplets, Shield, UtensilsCrossed, Flame, Radio, Bookmark } from "lucide-react";
import Image from "next/image";

// Özel ikon bileşeni türü
interface CustomIconProps extends LucideProps {
  src?: string;
}

// Icon interface tanımı
interface IconDefinition {
  component: JSX.Element;
  name: string;
}

// Özel ikon bileşeni oluşturucu
const createCustomIcon = (src: string): IconDefinition => {
  const CustomIcon = () => (
    <div className="relative w-5 h-5 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
      <Image
        src={src}
        alt="service icon"
        fill
        sizes="20px"
        className="object-contain p-[2px]"
      />
    </div>
  );

  return {
    component: <CustomIcon />,
    name: src.split('/').pop()?.split('.')[0].split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Custom Icon'
  };
};

// Lucide icon wrapper
const createLucideIcon = (Icon: React.ComponentType<LucideProps>, name: string): IconDefinition => ({
  component: <Icon className="w-6 h-6" />,
  name: name
});

// Hazır ikonlar
export const serviceIcons: Record<string, IconDefinition> = {
  // Streaming & Eğlence
  netflix: createCustomIcon("/ico/netflix.ico"),
  spotify: createCustomIcon("/ico/spotify.ico"),
  youtube: createCustomIcon("/ico/youtube.ico"),
  disneyPlus: createCustomIcon("/ico/disney+.ico"),
  amazonPrime: createCustomIcon("/ico/amazon_prime.ico"),
  appleTv: createCustomIcon("/ico/apple_tv.ico"),
  hboMax: createCustomIcon("/ico/hbo_max.ico"),
  bluTv: createCustomIcon("/ico/blutv.ico"),
  gain: createCustomIcon("/ico/gain_tv.ico"),
  mubi: createCustomIcon("/ico/mubi.ico"),
  twitch: createCustomIcon("/ico/twitch.ico"),
  deezer: createCustomIcon("/ico/deezer.ico"),
  appleMusic: createCustomIcon("/ico/apple_music.ico"),

  // Faturalar & Hizmetler
  internet: createLucideIcon(Wifi, "İnternet"),
  phone: createLucideIcon(Phone, "Telefon"),
  electricity: createLucideIcon(Zap, "Elektrik"),
  water: createLucideIcon(Droplets, "Su"),
  gas: createLucideIcon(Flame, "Doğalgaz"),
  cableTv: createLucideIcon(Tv, "Kablolu TV"),

  // Finans & Sigorta
  creditCard: createLucideIcon(CreditCard, "Kredi Kartı"),
  insurance: createLucideIcon(Shield, "Sigorta"),

  // Ulaşım
  car: createLucideIcon(Car, "Araç"),
  bus: createLucideIcon(Bus, "Otobüs"),
  train: createLucideIcon(Train, "Tren"),
  bike: createLucideIcon(Bike, "Bisiklet"),

  // Ev & Yaşam
  rent: createLucideIcon(Home, "Kira"),
  tools: createLucideIcon(Tool, "Aletler"),
  repair: createLucideIcon(Wrench, "Tamir"),

  // Eğlence & Hobiler
  playstation: createCustomIcon("/ico/playstation_plus.ico"),
  xbox: createCustomIcon("/ico/xbox_game_pass.ico"),
  gym: createCustomIcon("/ico/gym.ico"),
  gaming: createLucideIcon(Gamepad2, "Oyun"),
  books: createLucideIcon(BookOpen, "Kitaplar"),
  health: createLucideIcon(Heart, "Sağlık"),

  // Profesyonel Hizmetler
  microsoft365: createCustomIcon("/ico/microsoft365.ico"),
  adobe: createCustomIcon("/ico/adobe_creative_cloud.ico"),
  icloud: createCustomIcon("/ico/icloud.ico"),
  googleOne: createCustomIcon("/ico/google_one.ico"),
  zoom: createCustomIcon("/ico/zoom.ico"),
  linkedinPremium: createCustomIcon("/ico/linkedin_premium.ico"),
  domainHosting: createCustomIcon("/ico/domain-hosting.ico"),

  // Eğitim
  udemy: createCustomIcon("/ico/udemy.ico"),
  cambly: createCustomIcon("/ico/cambly.ico"),
  chatgpt: createCustomIcon("/ico/chatgpt.ico"),

  // Diğer
  coffee: createLucideIcon(Coffee, "Kahve"),
  food: createLucideIcon(UtensilsCrossed, "Yemek"),
  clothing: createLucideIcon(ShoppingBag, "Giyim"),
  savings: createLucideIcon(PiggyBank, "Birikim"),
  office: createLucideIcon(Briefcase, "Ofis"),
  education: createLucideIcon(GraduationCap, "Eğitim"),
  calendar: createLucideIcon(Calendar, "Takvim"),
  gift: createLucideIcon(Gift, "Hediye"),
  package: createLucideIcon(Package, "Paket"),
  other: createLucideIcon(Bookmark, "Diğer")
} as const;

export type ServiceIconName = keyof typeof serviceIcons;

export type ServiceIconComponent = (props: LucideProps) => JSX.Element; 