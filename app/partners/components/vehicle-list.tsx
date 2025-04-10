"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VehicleDialog } from "./vehicle-dialog";
import { VehicleFormValues } from "../schemas/vehicle-schema";
import { Car, Edit, Loader2, MoreHorizontalIcon, PlusIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

// Vehicle type definition
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  isForeignPlate: boolean;
  color?: string;
  capacity: number;
  vehicleType: string;
  status: string;
  lastMaintenance?: string;
  fuelType?: string;
  registrationDate?: string;
  createdAt: string;
  updatedAt: string;
  partnerId: string;
}

interface VehicleListProps {
  partnerId: string;
}

export function VehicleList({ partnerId }: VehicleListProps) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentVehicleId, setCurrentVehicleId] = useState<string | null>(null);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [showDeleteVehicleDialog, setShowDeleteVehicleDialog] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [defaultValues, setDefaultValues] = useState<Partial<VehicleFormValues>>({});

  // Fetch partner vehicles
  const fetchPartnerVehicles = async () => {
    setIsLoading(true);
    try {
      // Add error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`/api/partners/${partnerId}/vehicles`, {
        signal: controller.signal
      }).catch(err => {
        console.error("Fetch error:", err);
        throw new Error("Network error when fetching vehicles");
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(`Failed to fetch partner vehicles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error("Error fetching partner vehicles:", error);
      // Set empty array to prevent continuous loading state
      setVehicles([]);
      toast.error(error instanceof Error ? error.message : "Failed to load partner vehicles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) {
      fetchPartnerVehicles();
    }
  }, [partnerId]);

  // Handle add vehicle
  const handleAddVehicle = () => {
    setCurrentVehicleId(null);
    setIsEditingVehicle(false);
    setDefaultValues({
      make: "",
      model: "",
      year: new Date().getFullYear().toString(),
      licensePlate: "",
      isForeignPlate: false,
      color: "",
      capacity: "4",
      vehicleType: "SEDAN",
      status: "AVAILABLE",
      lastMaintenance: "",
    });
    setShowVehicleDialog(true);
  };

  // Handle edit vehicle
  const handleEditVehicle = async (vehicleId: string) => {
    setCurrentVehicleId(vehicleId);
    setIsEditingVehicle(true);
    setIsSubmitting(true);

    try {
      // Add error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`/api/partners/${partnerId}/vehicles/${vehicleId}`, {
        signal: controller.signal
      }).catch(err => {
        console.error("Fetch error:", err);
        throw new Error("Network error when fetching vehicle details");
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(`Failed to fetch vehicle details: ${response.status} ${response.statusText}`);
      }

      const vehicleData = await response.json();

      // Convert numeric values to strings for the form
      const formData = {
        ...vehicleData,
        year: vehicleData.year.toString(),
        capacity: vehicleData.capacity.toString(),
        lastMaintenance: vehicleData.lastMaintenance || "",
      };

      setDefaultValues(formData);
      setShowVehicleDialog(true);
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load vehicle details");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    try {
      // Add error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`/api/partners/${partnerId}/vehicles/${vehicleToDelete.id}`, {
        method: "DELETE",
        signal: controller.signal
      }).catch(err => {
        console.error("Fetch error:", err);
        throw new Error("Network error when deleting vehicle");
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to delete vehicle";

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }

        throw new Error(errorMessage);
      }

      toast.success(`Vehicle ${vehicleToDelete.make} ${vehicleToDelete.model} deleted successfully`);
      setShowDeleteVehicleDialog(false);
      setVehicleToDelete(null);
      fetchPartnerVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete vehicle");
    }
  };

  // Confirm delete vehicle
  const confirmDeleteVehicle = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteVehicleDialog(true);
  };

  // Handle vehicle form submission
  const handleSubmitVehicle = async (data: VehicleFormValues) => {
    console.log('Vehicle list received form data:', data);

    // Check if all required fields are present
    const requiredFields = ['brand', 'model', 'year', 'licensePlate', 'capacity'];
    const missingFields = requiredFields.filter(field => !data[field as keyof VehicleFormValues]);

    if (missingFields.length > 0) {
      console.error('Missing required fields in vehicle list:', missingFields);
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditingVehicle && currentVehicleId
        ? `/api/partners/${partnerId}/vehicles/${currentVehicleId}`
        : `/api/partners/${partnerId}/vehicles`;

      const method = isEditingVehicle ? "PUT" : "POST";

      // Add error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: controller.signal
      }).catch(err => {
        console.error("Fetch error:", err);
        throw new Error("Network error when saving vehicle");
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to save vehicle";

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }

        throw new Error(errorMessage);
      }

      const savedVehicle = await response.json();

      toast.success(
        isEditingVehicle
          ? `Vehicle ${savedVehicle.make} ${savedVehicle.model} updated successfully`
          : `Vehicle ${savedVehicle.make} ${savedVehicle.model} added successfully`
      );

      setShowVehicleDialog(false);
      fetchPartnerVehicles();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Vehicles</CardTitle>
            <CardDescription>
              Vehicles owned or operated by this partner
            </CardDescription>
          </div>
          <Button onClick={handleAddVehicle}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading vehicles...
                    </div>
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No vehicles found for this partner.</p>
                      <p className="text-sm text-muted-foreground">
                        Click the "Add Vehicle" button to add a vehicle.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Car className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {vehicle.make} {vehicle.model} {/* Database field is still 'make' */}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vehicle.year} • {vehicle.color || "No color"}
                            {vehicle.fuelType && ` • ${vehicle.fuelType}`}
                          </div>
                          {vehicle.registrationDate && (
                            <div className="text-xs text-muted-foreground">
                              Registered: {new Date(vehicle.registrationDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {vehicle.licensePlate}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {vehicle.isForeignPlate ? "Non-French plate" : "French plate"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {vehicle.vehicleType.charAt(0) + vehicle.vehicleType.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vehicle.status === "AVAILABLE" ? (
                        <Badge variant="success">Available</Badge>
                      ) : vehicle.status === "IN_USE" ? (
                        <Badge variant="default">In Use</Badge>
                      ) : vehicle.status === "MAINTENANCE" ? (
                        <Badge variant="warning">Maintenance</Badge>
                      ) : (
                        <Badge variant="destructive">Out of Service</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEditVehicle(vehicle.id)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => confirmDeleteVehicle(vehicle)}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {vehicles.length > 0 && (
          <CardFooter className="flex justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Total vehicles: {vehicles.length}
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Vehicle Dialog */}
      <VehicleDialog
        open={showVehicleDialog}
        onOpenChange={setShowVehicleDialog}
        onSubmit={handleSubmitVehicle}
        defaultValues={defaultValues}
        isSubmitting={isSubmitting}
        isEditMode={isEditingVehicle}
        partnerId={partnerId}
      />

      {/* Delete Vehicle Confirmation Dialog */}
      <AlertDialog open={showDeleteVehicleDialog} onOpenChange={setShowDeleteVehicleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVehicle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
