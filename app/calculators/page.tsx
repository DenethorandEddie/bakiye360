import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ChevronRight, BadgeDollarSign, Percent, ArrowUpDown, Building, CreditCard, PiggyBank } from "lucide-react";

export default function CalculatorsPage() {
  const calculators = [
    {
      id: 'credit',
      title: 'Kredi Hesaplayıcısı',
      description: 'Kredi tutarı, faiz oranı ve vade bilgilerine göre aylık taksitleri hesaplayın.',
      icon: <CreditCard className="h-5 w-5" />,
      href: '/calculators/credit',
      isAvailable: true,
    },
    {
      id: 'investment',
      title: 'Yatırım Getiri Hesaplayıcısı',
      description: 'Yatırımlarınızın süreye ve getiri oranına göre potansiyel değerini hesaplayın.',
      icon: <BadgeDollarSign className="h-5 w-5" />,
      href: '/calculators/investment',
      isAvailable: false,
    },
    {
      id: 'interest',
      title: 'Faiz Hesaplayıcısı',
      description: 'Basit veya bileşik faiz yöntemine göre birikim hesaplayın.',
      icon: <Percent className="h-5 w-5" />,
      href: '/calculators/interest',
      isAvailable: false,
    },
    {
      id: 'mortgage',
      title: 'Konut Kredisi Hesaplayıcısı',
      description: 'Konut kredisi tutarı, faiz oranı ve vadesi ile aylık ödemelerinizi hesaplayın.',
      icon: <Building className="h-5 w-5" />,
      href: '/calculators/mortgage',
      isAvailable: false,
    },
    {
      id: 'savings',
      title: 'Tasarruf Hesaplayıcısı',
      description: 'Düzenli birikim ile belirli bir sürede ne kadar tasarruf edebileceğinizi hesaplayın.',
      icon: <PiggyBank className="h-5 w-5" />,
      href: '/calculators/savings',
      isAvailable: false,
    },
    {
      id: 'exchange',
      title: 'Döviz Hesaplayıcısı',
      description: 'Döviz kurlarına göre para biriminizi dönüştürün.',
      icon: <ArrowUpDown className="h-5 w-5" />,
      href: '/calculators/exchange',
      isAvailable: false,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Finansal Hesaplayıcılar</h1>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculators.map((calculator) => (
          <Card 
            key={calculator.id}
            className={`border-foreground/5 bg-background/40 backdrop-blur hover:shadow-md transition-all duration-200 ${
              calculator.isAvailable ? 'hover:border-primary/30' : 'opacity-60'
            }`}
          >
            {calculator.isAvailable ? (
              <Link href={calculator.href} className="block h-full p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-foreground/5">
                    <span className="text-primary">{calculator.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium mb-1">{calculator.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{calculator.description}</p>
                    <div className="flex justify-end mt-3">
                      <span className="text-xs text-primary font-medium flex items-center">
                        Hesapla
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="block h-full p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-foreground/5">
                    <span className="text-muted-foreground">{calculator.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium mb-1">{calculator.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{calculator.description}</p>
                    <div className="flex justify-end mt-3">
                      <span className="text-xs text-muted-foreground flex items-center">
                        Yakında
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      <div className="bg-background/30 backdrop-blur border border-foreground/5 rounded-lg p-4 mt-6 text-xs text-muted-foreground">
        <p>
          Finansal hesaplayıcılarımız bilgilendirme amaçlıdır. Önemli finansal kararlar vermeden önce bir finans uzmanına danışmanızı öneririz.
        </p>
      </div>
    </div>
  );
} 