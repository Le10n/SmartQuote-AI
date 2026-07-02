import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductRow } from "@/types/database";

const productSchema = z.object({
  sku: z.string().min(2, "SKU is required"),
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  purchase_price: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0),
  tax: z.coerce.number().min(0).max(100),
  stock: z.coerce.number().min(0),
  unit: z.string().min(1),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: ProductRow | null;
  submitting?: boolean;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, submitting, onSubmit, onCancel }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      category: "",
      purchase_price: 0,
      selling_price: 0,
      tax: 20,
      stock: 0,
      unit: "pcs",
    },
  });

  useEffect(() => {
    form.reset({
      sku: product?.sku ?? "",
      name: product?.name ?? "",
      description: product?.description ?? "",
      category: product?.category ?? "",
      purchase_price: product?.purchase_price ?? 0,
      selling_price: product?.selling_price ?? 0,
      tax: product?.tax ?? 20,
      stock: product?.stock ?? 0,
      unit: product?.unit ?? "pcs",
    });
  }, [form, product]);

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...form.register("sku")} />
          {form.formState.errors.sku ? <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name ? <p className="text-sm text-destructive">{form.formState.errors.name.message}</p> : null}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...form.register("category")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="purchase_price">Purchase price</Label>
          <Input id="purchase_price" type="number" step="0.01" {...form.register("purchase_price", { valueAsNumber: true })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="selling_price">Selling price</Label>
          <Input id="selling_price" type="number" step="0.01" {...form.register("selling_price", { valueAsNumber: true })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tax">Tax %</Label>
          <Input id="tax" type="number" step="0.01" {...form.register("tax", { valueAsNumber: true })} />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" step="0.01" {...form.register("stock", { valueAsNumber: true })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" {...form.register("unit")} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving" : "Save product"}</Button>
      </div>
    </form>
  );
}
