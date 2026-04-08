import { useState } from 'react';
import { Building } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddBuildingFormProps {
  onAdd: (building: Omit<Building, 'id' | 'createdAt'>) => void;
}

export function AddBuildingForm({ onAdd }: AddBuildingFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    apartmentCount: '',
    baseExpenses: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address || !formData.apartmentCount || !formData.baseExpenses) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    onAdd({
      address: formData.address,
      apartmentCount: parseInt(formData.apartmentCount),
      baseExpenses: parseFloat(formData.baseExpenses),
    });

    setFormData({ address: '', apartmentCount: '', baseExpenses: '' });
    setOpen(false);
    toast.success('Edificio agregado exitosamente');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Agregar Edificio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Nuevo Edificio
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Av. Corrientes 1234"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apartmentCount">Cantidad de Departamentos</Label>
            <Input
              id="apartmentCount"
              type="number"
              min="1"
              value={formData.apartmentCount}
              onChange={(e) => setFormData({ ...formData, apartmentCount: e.target.value })}
              placeholder="10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseExpenses">Expensas Base</Label>
            <Input
              id="baseExpenses"
              type="number"
              min="0"
              step="0.01"
              value={formData.baseExpenses}
              onChange={(e) => setFormData({ ...formData, baseExpenses: e.target.value })}
              placeholder="15000"
            />
          </div>
          <Button type="submit" className="w-full">
            Agregar Edificio
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
