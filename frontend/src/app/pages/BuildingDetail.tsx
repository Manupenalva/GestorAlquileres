import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Building, Tenant, Payment } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AddTenantForm } from '../components/AddTenantForm';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { RegisterPaymentDialog } from '../components/RegisterPaymentDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { ArrowLeft, Building2, MapPin, Home, DollarSign, BarChart3, Phone, Mail, Calendar, CheckCircle2, XCircle, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface BuildingDetailProps {
  buildings: Building[];
  tenants: Tenant[];
  payments: Payment[];
  buildingsLoading?: boolean;
  onDeleteBuilding: (buildingId: number) => Promise<void>;
  onAddTenant: (tenant: Omit<Tenant, 'id'>) => Promise<void>;
  onRemoveTenant: (tenantId: string) => Promise<void>;
  onAddExpense: (expense: any) => void;
  onRegisterPayment: (payment: Omit<Payment, 'id' | 'date'>) => Promise<void>;
}

export function BuildingDetail({ 
  buildings, 
  tenants, 
  payments,
  buildingsLoading,
  onDeleteBuilding,
  onAddTenant,
  onRemoveTenant,
  onAddExpense,
  onRegisterPayment,
}: BuildingDetailProps) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { id } = useParams();
  const building = buildings.find(b => String(b.id) === id);
  const buildingId = building ? String(building.id) : id ?? '';
  const buildingTenants = tenants.filter(t => t.buildingId === buildingId);

  if (!building && deleting) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Eliminando edificio...
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDeleteBuilding = async () => {
    if (!building || deleting) {
      return;
    }

    try {
      setDeleting(true);
      await onDeleteBuilding(building.id);
      toast.success('Edificio eliminado correctamente');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el edificio');
      setDeleting(false);
    }
  };

  if (!building && buildingsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Cargando edificio...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Edificio no encontrado</p>
            <Link to="/">
              <Button variant="outline" className="mt-4">
                Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCurrentMonthPaymentStatus = (tenantId: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return payments.find(p => p.tenantId === tenantId && p.month === currentMonth);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="size-4" />
            Volver
          </Button>
        </Link>
        
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="mb-2 flex items-center gap-2">
              <Building2 className="size-8" />
              {building.nombre}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="size-4" />
              {building.direccion}
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <AddTenantForm buildingId={buildingId} onAdd={onAddTenant} />
            <AddExpenseForm buildingId={buildingId} onAdd={onAddExpense} />
            <Link to={`/building/${buildingId}/report`}>
              <Button variant="default" className="gap-2">
                <BarChart3 className="size-4" />
                Reporte Mensual
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2" disabled={deleting}>
                  <Trash2 className="size-4" />
                  Eliminar Edificio
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar edificio</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta accion eliminara el edificio {building.nombre}. Esta seguro que desea continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteBuilding} disabled={deleting}>
                    {deleting ? 'Eliminando...' : 'Si, eliminar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Home className="size-4" />
              Departamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{building.cantidadDepartamentos ?? 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="size-4" />
              Inquilinos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{building.cantidadInquilinos ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="size-4" />
              Expensas Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              ${(building.expensasBase ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inquilinos</CardTitle>
        </CardHeader>
        <CardContent>
          {buildingTenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay inquilinos registrados en este edificio
            </div>
          ) : (
            <div className="space-y-4">
              {buildingTenants.map((tenant) => {
                const paymentStatus = getCurrentMonthPaymentStatus(tenant.id);
                const isPaid = paymentStatus?.isPaid || false;
                
                return (
                  <Card key={tenant.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-3 mb-3">
                            <div>
                              <h3 className="flex items-center gap-2">
                                {tenant.firstName} {tenant.lastName}
                                {isPaid ? (
                                  <Badge className="gap-1 bg-green-500">
                                    <CheckCircle2 className="size-3" />
                                    Pagado
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="gap-1">
                                    <XCircle className="size-3" />
                                    Pendiente
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Piso {tenant.floor}, Dpto. {tenant.apartmentNumber}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="size-4 text-muted-foreground" />
                              <span>{tenant.email}</span>
                            </div>
                            {tenant.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="size-4 text-muted-foreground" />
                                <span>{tenant.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <DollarSign className="size-4 text-muted-foreground" />
                              <span>Alquiler: ${tenant.rentAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="size-4 text-muted-foreground" />
                              <span>Paga el día {tenant.paymentDayOfMonth}</span>
                            </div>
                            {tenant.contractExpirationDate && (
                              <div className="flex items-center gap-2 col-span-2">
                                <Calendar className="size-4 text-muted-foreground" />
                                <span>Vence: {new Date(tenant.contractExpirationDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <RegisterPaymentDialog
                            tenantId={tenant.id}
                            tenantName={`${tenant.firstName} ${tenant.lastName}`}
                            buildingId={buildingId}
                            rentAmount={tenant.rentAmount}
                            onRegister={onRegisterPayment}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="size-4 mr-2" />
                                Quitar Inquilino
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Quitar inquilino</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará la relación del inquilino {tenant.firstName} con este departamento. El usuario seguirá existiendo en el sistema. ¿Desea continuar?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    try {
                                      await onRemoveTenant(tenant.id);
                                      toast.success('Inquilino quitado correctamente');
                                    } catch (error) {
                                      toast.error(error instanceof Error ? error.message : 'No se pudo quitar al inquilino');
                                    }
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Quitar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          {paymentStatus && (
                            <p className="text-xs text-muted-foreground text-center">
                              ${paymentStatus.amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}