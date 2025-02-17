"use client"

import Image from "next/image"
import { CalendarIcon } from "lucide-react"
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
type InspectionSection = {
  scratches: number;
  missingParts: number;
  damageBumps: number;
}

type InspectionData = {
  frontLeftSide: InspectionSection;
  frontRightSide: InspectionSection;
}

type FormData = {
  property: string;
  cartNumber: string;
  date: Date | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  observations: string;
  signatureChecked: boolean;
  frontLeftScratchesQuantity: number;
  frontLeftMissingPartsQuantity: number;
  frontLeftDamageBumpsQuantity: number;
  frontRightScratchesQuantity: number;
  frontRightMissingPartsQuantity: number;
  frontRightDamageBumpsQuantity: number;
}

export default function GolfCartInspectionForm() {
  const [signaturePad, setSignaturePad] = useState<any>(null)
  const [inspectionData, setInspectionData] = useState<InspectionData>({
    frontLeftSide: { scratches: 0, missingParts: 0, damageBumps: 0 },
    frontRightSide: { scratches: 0, missingParts: 0, damageBumps: 0 },
  })
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
      frontLeftScratchesQuantity: 0,
      frontLeftMissingPartsQuantity: 0,
      frontLeftDamageBumpsQuantity: 0,
      frontRightScratchesQuantity: 0,
      frontRightMissingPartsQuantity: 0,
      frontRightDamageBumpsQuantity: 0,
    }
  })

  // Función para generar PDF
  const generatePDF = async () => {
    if (!formRef.current) return

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Capturar todo el formulario
    const canvas = await html2canvas(formRef.current, {
      scale: 2,  // Aumentar resolución
      useCORS: true  // Manejar imágenes de diferentes orígenes
    })
    const imgData = canvas.toDataURL('image/png')

    // Obtener dimensiones del PDF
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Calcular dimensiones de la imagen
    const imgWidth = pageWidth - 20  // Márgenes
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Centrar la imagen
    const x = (pageWidth - imgWidth) / 2
    const y = 10  // Pequeño margen superior

    // Añadir imagen
    doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)

    // Añadir título
    doc.setFontSize(16)
    doc.text('Golf Cart Inspection Report', pageWidth / 2, 10, { align: 'center' })

    // Guardar PDF
    doc.save(`golf-cart-inspection-${Date.now()}.pdf`)
  }

  const handleInspectionDataChange = (
    section: keyof InspectionData, 
    issue: keyof InspectionSection, 
    value: string
  ) => {
    setInspectionData((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [issue]: Number.parseInt(value) || 0,
      },
    }))
  }

  const onSubmit = async (data: FormData) => {
    // Validate and convert Golf Cart Number
    const cartNumber = parseInt(data.cartNumber, 10)
    if (isNaN(cartNumber)) {
      alert("Por favor, ingrese un número de carro válido")
      return
    }

    // Format date for Airtable (YYYY-MM-DD format)
    const formattedDate = data.date ? format(data.date, 'yyyy-MM-dd') : null

    // Generate a unique inspection ID
    const inspectionId = `${data.property}-${cartNumber}-${formattedDate}-${Date.now()}`

    // Función para sanitizar cantidad
    const sanitizeQuantity = (value: number | string): number => {
      const num = Number(value)
      return isNaN(num) ? 0 : Math.max(0, Math.floor(num))
    }

    // Prepare multiple records for Airtable
    const inspectionRecords = [
      // Scratches records
      {
        "Inspection ID": inspectionId,
        Property: data.property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": formattedDate,
        "Guest Name": data.guestName,
        "Guest Email": data.guestEmail,
        "Guest Phone": data.guestPhone,
        Section: "Front Left",
        "Damage Type": "Scratches",
        Quantity: sanitizeQuantity(data.frontLeftScratchesQuantity),
        "Preview observations by Guest": data.observations || "",
        "Signature Checked": data.signatureChecked
      },
      {
        "Inspection ID": inspectionId,
        Property: data.property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": formattedDate,
        "Guest Name": data.guestName,
        "Guest Email": data.guestEmail,
        "Guest Phone": data.guestPhone,
        Section: "Front Right",
        "Damage Type": "Scratches",
        Quantity: sanitizeQuantity(data.frontRightScratchesQuantity),
        "Preview observations by Guest": data.observations || "",
        "Signature Checked": data.signatureChecked
      },
      // Missing Parts records
      {
        "Inspection ID": inspectionId,
        Property: data.property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": formattedDate,
        "Guest Name": data.guestName,
        "Guest Email": data.guestEmail,
        "Guest Phone": data.guestPhone,
        Section: "Front Left",
        "Damage Type": "Missing Parts",
        Quantity: sanitizeQuantity(data.frontLeftMissingPartsQuantity),
        "Preview observations by Guest": data.observations || "",
        "Signature Checked": data.signatureChecked
      },
      {
        "Inspection ID": inspectionId,
        Property: data.property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": formattedDate,
        "Guest Name": data.guestName,
        "Guest Email": data.guestEmail,
        "Guest Phone": data.guestPhone,
        Section: "Front Right",
        "Damage Type": "Missing Parts",
        Quantity: sanitizeQuantity(data.frontRightMissingPartsQuantity),
        "Preview observations by Guest": data.observations || "",
        "Signature Checked": data.signatureChecked
      },
      // Damage/Bumps records
      {
        "Inspection ID": inspectionId,
        Property: data.property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": formattedDate,
        "Guest Name": data.guestName,
        "Guest Email": data.guestEmail,
        "Guest Phone": data.guestPhone,
        Section: "Front Left",
        "Damage Type": "Damage/Bumps",
        Quantity: sanitizeQuantity(data.frontLeftDamageBumpsQuantity),
        "Preview observations by Guest": data.observations || "",
        "Signature Checked": data.signatureChecked
      },
      {
        "Inspection ID": inspectionId,
        Property: data.property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": formattedDate,
        "Guest Name": data.guestName,
        "Guest Email": data.guestEmail,
        "Guest Phone": data.guestPhone,
        Section: "Front Right",
        "Damage Type": "Damage/Bumps",
        Quantity: sanitizeQuantity(data.frontRightDamageBumpsQuantity),
        "Preview observations by Guest": data.observations || "",
        "Signature Checked": data.signatureChecked
      }
    ]

    // Filter out records with zero quantity
    const filteredRecords = inspectionRecords.filter(record => record.Quantity > 0)

    try {
      console.log("Submitting records:", filteredRecords)

      // Submit all records sequentially with error details
      const responses = []
      for (const record of filteredRecords) {
        try {
          console.log("Attempting to submit record:", record)

          const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fields: record }),
          })

          const responseData = await response.json()

          if (!response.ok) {
            console.error("Failed to submit record:", {
              record,
              status: response.status,
              errorType: responseData.error?.type,
              errorMessage: responseData.error?.message,
              fullErrorResponse: responseData
            })
            
            // Show detailed error to user
            alert(`Error al guardar registro: ${responseData.error?.message || 'Error desconocido'}`)
          }

          responses.push(response)
        } catch (recordError) {
          console.error("Error submitting individual record:", {
            record,
            error: recordError
          })
          
          // Show error to user
          alert(`Error de red al guardar registro: ${recordError.message}`)
        }
      }

      // Check if all submissions were successful
      const allSuccessful = responses.every(response => response.ok)

      if (allSuccessful) {
        console.log("All records submitted successfully to Airtable")
        
        // Generate PDF
        await generatePDF()

        // Reset form after successful submission
        form.reset()
        setInspectionData({
          frontLeftSide: { scratches: 0, missingParts: 0, damageBumps: 0 },
          frontRightSide: { scratches: 0, missingParts: 0, damageBumps: 0 },
        })
        if (signaturePad) {
          signaturePad.clear()
        }
        // Optional: Show success message to user
        alert("Inspección guardada exitosamente")
      } else {
        console.error("Failed to submit some records to Airtable")
        alert("Error al guardar algunos registros de la inspección")
      }
    } catch (error) {
      console.error("Error submitting to Airtable:", error)
      alert(`Error de red: No se pudo guardar la inspección`)
    }
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
                fill
                className="object-contain"
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead>Scratches</TableHead>
                  <TableHead>Missing Parts</TableHead>
                  <TableHead>Damage/Bumps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Front Left</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name="frontLeftScratchesQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              step="1"
                              pattern="\d*"
                              inputMode="numeric"
                              placeholder="0"
                              className="appearance-none"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '')
                                field.onChange(value)
                                handleInspectionDataChange(
                                  'frontLeftSide', 
                                  'scratches', 
                                  Number(value)
                                )
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name="frontLeftMissingPartsQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              step="1"
                              pattern="\d*"
                              inputMode="numeric"
                              placeholder="0"
                              className="appearance-none"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '')
                                field.onChange(value)
                                handleInspectionDataChange(
                                  'frontLeftSide', 
                                  'missingParts', 
                                  Number(value)
                                )
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name="frontLeftDamageBumpsQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              step="1"
                              pattern="\d*"
                              inputMode="numeric"
                              placeholder="0"
                              className="appearance-none"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '')
                                field.onChange(value)
                                handleInspectionDataChange(
                                  'frontLeftSide', 
                                  'damageBumps', 
                                  Number(value)
                                )
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Front Right</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name="frontRightScratchesQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              step="1"
                              pattern="\d*"
                              inputMode="numeric"
                              placeholder="0"
                              className="appearance-none"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '')
                                field.onChange(value)
                                handleInspectionDataChange(
                                  'frontRightSide', 
                                  'scratches', 
                                  Number(value)
                                )
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name="frontRightMissingPartsQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              step="1"
                              pattern="\d*"
                              inputMode="numeric"
                              placeholder="0"
                              className="appearance-none"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '')
                                field.onChange(value)
                                handleInspectionDataChange(
                                  'frontRightSide', 
                                  'missingParts', 
                                  Number(value)
                                )
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name="frontRightDamageBumpsQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              step="1"
                              pattern="\d*"
                              inputMode="numeric"
                              placeholder="0"
                              className="appearance-none"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '')
                                field.onChange(value)
                                handleInspectionDataChange(
                                  'frontRightSide', 
                                  'damageBumps', 
                                  Number(value)
                                )
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

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
