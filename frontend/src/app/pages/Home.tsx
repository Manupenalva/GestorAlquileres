import { Building } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Building2, MapPin, Home as HomeIcon, DollarSign } from 'lucide-react';
import { Link } from 'react-router';

interface HomeProps {
  buildings: Building[];
}

export function Home({ buildings }: HomeProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-2">
          <Building2 className="size-8" />
          Mis Edificios
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus propiedades, inquilinos y pagos
        </p>
      </div>

      {buildings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="size-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No hay edificios registrados. Comienza agregando un nuevo edificio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => (
            <Link key={building.id} to={`/building/${building.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="size-5" />
                    Edificio
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    {building.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <HomeIcon className="size-4 text-muted-foreground" />
                    <span>{building.apartmentCount} departamentos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="size-4 text-muted-foreground" />
                    <span>Expensas: ${building.baseExpenses.toLocaleString()}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}