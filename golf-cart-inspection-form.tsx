"use client"

import Image from "next/legacy/image"
import { CalendarIcon, PlusIcon, TrashIcon } from "lucide-react"
import { format } from "date-fns"
import { useState, useRef } from "react"
import SignatureCanvas from "react-signature-canvas"
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useForm } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"

// Airtable configuration (to be completed later)
const AIRTABLE_API_KEY = "patPipF2khc2ardsu.02bfb33fe862b775367438629e8b29e60660b40d60c543ae2552bb597de696a4"
const AIRTABLE_BASE_ID = "appNuegQuklxOYfDE"
const AIRTABLE_TABLE_NAME = "GolfCart"

// Tipos para la estructura de datos de inspección
type FormData = {
  property: string;
  cartNumber: string;
  date: Date | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  observations: string;
  signatureChecked: boolean;
}

export default function GolfCartInspectionForm() {
  const [signaturePad, setSignaturePad] = useState<any>(null)
  const [damageRecords, setDamageRecords] = useState<{
    section: string;
    damageType: string;
    quantity: number;
  }[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<FormData>({
    defaultValues: {
      property: "",
      cartNumber: "",
      date: null,
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      observations: "",
      signatureChecked: false,
    }
  })

  // Function to add a new damage record
  const addDamageRecord = () => {
    setDamageRecords([
      ...damageRecords, 
      { section: "", damageType: "", quantity: 0 }
    ])
  }

  // Function to remove a damage record
  const removeDamageRecord = (indexToRemove: number) => {
    setDamageRecords(damageRecords.filter((_, index) => index !== indexToRemove))
  }

  // Función para generar PDF
  const generatePDF = async (data: FormData, damageRecords: {section: string, damageType: string, quantity: number}[]) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Configuraciones de estilo
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 10
    let currentY = margin

    // Título del documento
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Golf Cart Inspection Report', pageWidth / 2, currentY, { align: 'center' })
    currentY += 15

    // Información del huésped
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nombre: ${data.guestName}`, margin, currentY)
    currentY += 7
    doc.text(`Correo Electrónico: ${data.guestEmail}`, margin, currentY)
    currentY += 7
    doc.text(`Teléfono: ${data.guestPhone}`, margin, currentY)
    currentY += 7
    doc.text(`Propiedad: ${data.property}`, margin, currentY)
    currentY += 7
    doc.text(`Número de Carro: ${data.cartNumber}`, margin, currentY)
    currentY += 7
    
    // Fecha de inspección
    const inspectionDate = data.date ? format(data.date, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')
    doc.text(`Fecha de Inspección: ${inspectionDate}`, margin, currentY)
    currentY += 10

    // Registros de daños
    if (damageRecords.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('Registros de Daños:', margin, currentY)
      currentY += 7
      
      doc.setFont('helvetica', 'normal')
      damageRecords.forEach((record, index) => {
        doc.text(`${index + 1}. Sección: ${record.section}`, margin, currentY)
        currentY += 5
        doc.text(`   Tipo de Daño: ${record.damageType}`, margin, currentY)
        currentY += 5
        doc.text(`   Cantidad: ${record.quantity}`, margin, currentY)
        currentY += 7
      })
    }

    // Observaciones
    if (data.observations) {
      doc.setFont('helvetica', 'bold')
      doc.text('Observaciones:', margin, currentY)
      currentY += 7
      
      doc.setFont('helvetica', 'normal')
      // Dividir observaciones largas en múltiples líneas
      const observationLines = doc.splitTextToSize(data.observations, pageWidth - 2 * margin)
      doc.text(observationLines, margin, currentY)
      currentY += (observationLines.length * 5)
    }

    // Sección de Firma con más detalles
    currentY += 15
    doc.setFont('helvetica', 'bold')
    doc.text('Firma del Huésped', margin, currentY)
    currentY += 7

    // Cuadro de firma con líneas de referencia
    doc.setLineWidth(0.5)
    doc.setDrawColor(200) // Color gris claro
    
    // Rectángulo para firma
    const signatureBoxWidth = pageWidth - 2 * margin
    const signatureBoxHeight = 40
    doc.rect(margin, currentY, signatureBoxWidth, signatureBoxHeight)

    // Líneas de firma
    const lineSpacing = signatureBoxHeight / 4
    for (let i = 1; i < 4; i++) {
      doc.setDrawColor(230) // Color gris más claro
      doc.line(margin, currentY + i * lineSpacing, margin + signatureBoxWidth, currentY + i * lineSpacing)
    }

    // Texto adicional
    currentY += signatureBoxHeight + 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100) // Gris oscuro
    doc.text('Al firmar, confirmo que la inspección del carrito de golf es precisa y acepto los términos.', margin, currentY)

    // Pie de página
    doc.setFontSize(8)
    doc.setTextColor(150) // Gris medio
    doc.text(`Documento generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, pageWidth - 10, { align: 'left' })

    // Convertir PDF a Blob
    return doc.output('blob')
  }

  const onSubmit = async (data: FormData) => {
    // Validar campos requeridos
    if (!data.guestName || !data.guestName.trim()) {
      alert("Por favor, ingrese el nombre del huésped")
      return
    }

    if (!data.guestEmail || !isValidEmail(data.guestEmail)) {
      alert("Por favor, ingrese un correo electrónico válido")
      return
    }

    // Validate and convert Golf Cart Number
    const cartNumber = parseInt(data.cartNumber, 10)
    if (isNaN(cartNumber)) {
      alert("Por favor, ingrese un número de carro válido")
      return
    }

    // Format date for Airtable (YYYY-MM-DD format)
    const formattedDate = data.date ? format(data.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')

    // Generate a unique inspection ID
    const inspectionId = `cart${cartNumber}-${formattedDate}-${Date.now()}`
      .replace(/[^a-zA-Z0-9-]/g, '') // Remove any invalid characters
      .toLowerCase() // Ensure lowercase for URL safety

    try {
      // Generate PDF with all form details
      const pdfBlob = await generatePDF(data, damageRecords)

      // Prepare Airtable record data
      const airtableRecord = {
        "Inspection ID": inspectionId,
        "Property": data.property || "Sin Especificar",
        "Golf Cart Number": cartNumber,
        "Inspection Date": formattedDate,
        "Guest Name": data.guestName.trim(),
        "Guest Email": data.guestEmail.trim().toLowerCase(),
        "Guest Phone": (data.guestPhone || "").trim(),
        "Golf Cart Inspection Send": true,
        "Golf Cart Signature Checked": !!data.signatureChecked
      }

      // Convert PDF to base64 for transmission
      const pdfBase64 = pdfBlob ? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          try {
            const base64data = (reader.result as string).split(',')[1]
            resolve(base64data)
          } catch (error) {
            console.error("Error converting PDF to base64:", error)
            reject(error)
          }
        }
        reader.onerror = (error) => {
          console.error("FileReader error:", error)
          reject(error)
        }
        reader.readAsDataURL(pdfBlob)
      }) : null

      // Preparar datos de daños
      const damageRecordsData = damageRecords.map(record => ({
        section: record.section || "No especificado",
        damageType: record.damageType || "No especificado",
        quantity: record.quantity || 0
      }))

      // Submit to API (which will handle Airtable and email)
      const apiResponse = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          airtableRecord: airtableRecord,
          pdfFile: pdfBase64,
          damageRecords: damageRecordsData,
          guestEmail: data.guestEmail.trim().toLowerCase() // Enviar correo explícitamente
        })
      });

      const apiResponseData = await apiResponse.json()

      if (!apiResponseData.success) {
        console.error("API submission failed:", apiResponseData)
        alert(`Error al guardar la inspección: ${apiResponseData.message || 'Error desconocido'}`)
        return
      }

      // Success message
      alert(`Inspección guardada exitosamente. Se ha enviado un correo a ${data.guestEmail} con el PDF adjunto`)

      // Reset form
      form.reset()
      setDamageRecords([])
      if (signaturePad) {
        signaturePad.clear()
      }

    } catch (error: unknown) {
      console.error("Error submitting to API:", error)
      alert(`Error de red: No se pudo guardar la inspección`)
    }
  }

  // Función de validación de correo electrónico
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Golf Cart Inspection</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form 
            ref={formRef}
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-8"
          >
            <div className="relative w-full h-[400px] mb-6">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Golf%20Cart%20Damage%20Inspection%20Check%20list%20Four%20Seater%20edited-qJbaES9ueamIzo64B8vaA7Ln65pMiZ.png"
                alt="Golf Cart Inspection Diagram"
                layout="fill"
                objectFit="contain"
                unoptimized
                quality={100}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="property"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="villa-flora">Villa Flora</SelectItem>
                        <SelectItem value="villa-clara">Villa Clara</SelectItem>
                        <SelectItem value="villa-paloma">Villa Paloma</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cartNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Golf Cart Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter cart number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspection Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value || undefined} 
                          onSelect={field.onChange} 
                          initialFocus 
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3 mt-4">
              <FormField
                control={form.control}
                name="guestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter guest name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guestEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter guest email" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guestPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter guest phone" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Dynamic Damage Records */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Damage Records</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addDamageRecord}
                >
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Record
                </Button>
              </div>

              {damageRecords.map((record, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 items-center border p-4 rounded-md">
                  <Select 
                    value={record.section} 
                    onValueChange={(value) => {
                      const newRecords = [...damageRecords]
                      newRecords[index].section = value
                      setDamageRecords(newRecords)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Front Left", "Front Right", "Rear Left", "Rear Right"].map((section) => (
                        <SelectItem key={section} value={section}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={record.damageType} 
                    onValueChange={(value) => {
                      const newRecords = [...damageRecords]
                      newRecords[index].damageType = value
                      setDamageRecords(newRecords)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Damage Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scratches">Scratches</SelectItem>
                      <SelectItem value="Missing Parts">Missing Parts</SelectItem>
                      <SelectItem value="Damage/Bumps">Damage/Bumps</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input 
                    type="number" 
                    placeholder="Quantity" 
                    value={record.quantity} 
                    onChange={(e) => {
                      const newRecords = [...damageRecords]
                      newRecords[index].quantity = Number(e.target.value)
                      setDamageRecords(newRecords)
                    }}
                  />

                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => removeDamageRecord(index)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preview observations by Guest</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter observations"
                      className="min-h-[100px]"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="signatureChecked"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I have read and accept the inspection terms
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="border rounded-md p-4 bg-muted/10">
              <SignatureCanvas
                ref={(ref) => setSignaturePad(ref)}
                canvasProps={{
                  className: "w-full h-[100px]",
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => signaturePad?.clear()} 
                className="mt-2"
              >
                Borrar Firma
              </Button>
            </div>

            <Button type="submit" className="w-full">
              Submit Inspection
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
