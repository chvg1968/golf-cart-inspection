"use client"

import Image from "next/image"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import SignatureCanvas from "react-signature-canvas"

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

// Airtable configuration (to be completed later)
const AIRTABLE_API_KEY = "patPipF2khc2ardsu.02bfb33fe862b775367438629e8b29e60660b40d60c543ae2552bb597de696a4"
const AIRTABLE_BASE_ID = "appNuegQuklxOYfDE"
const AIRTABLE_TABLE_NAME = "GolfCart"

export default function GolfCartInspectionForm() {
  const form = useForm()
  const [inspectionData, setInspectionData] = useState({
    frontLeftSide: { scratches: 0, missingParts: 0, damageBumps: 0 },
    frontRightSide: { scratches: 0, missingParts: 0, damageBumps: 0 },
  })
  const [signaturePad, setSignaturePad] = useState(null)

  const handleInspectionDataChange = (section, issue, value) => {
    setInspectionData((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [issue]: Number.parseInt(value) || 0,
      },
    }))
  }

  const clearSignature = () => {
    signaturePad?.clear()
  }

  const onSubmit = async (data) => {
    // Combine form data with inspection data
    const submissionData = {
      ...data,
      inspectionData,
      signature: signaturePad?.toDataURL(),
    }

    // Basic Airtable submission function (to be completed)
    try {
      const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: submissionData,
        }),
      })

      if (response.ok) {
        console.log("Data submitted successfully to Airtable")
      } else {
        console.error("Failed to submit data to Airtable")
      }
    } catch (error) {
      console.error("Error submitting to Airtable:", error)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Golf Cart Inspection</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <TableCell>Front Left Side</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={inspectionData.frontLeftSide.scratches}
                      onChange={(e) => handleInspectionDataChange("frontLeftSide", "scratches", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={inspectionData.frontLeftSide.missingParts}
                      onChange={(e) => handleInspectionDataChange("frontLeftSide", "missingParts", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={inspectionData.frontLeftSide.damageBumps}
                      onChange={(e) => handleInspectionDataChange("frontLeftSide", "damageBumps", e.target.value)}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Front Right Side</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={inspectionData.frontRightSide.scratches}
                      onChange={(e) => handleInspectionDataChange("frontRightSide", "scratches", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={inspectionData.frontRightSide.missingParts}
                      onChange={(e) => handleInspectionDataChange("frontRightSide", "missingParts", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={inspectionData.frontRightSide.damageBumps}
                      onChange={(e) => handleInspectionDataChange("frontRightSide", "damageBumps", e.target.value)}
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
              name="signature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signature</FormLabel>
                  <FormControl>
                    <div className="border rounded-md p-4 bg-muted/10">
                      <SignatureCanvas
                        ref={(ref) => setSignaturePad(ref)}
                        canvasProps={{
                          className: "w-full h-[100px]",
                        }}
                        onEnd={() => field.onChange(signaturePad?.toDataURL())}
                      />
                    </div>
                  </FormControl>
                  <Button type="button" variant="outline" onClick={clearSignature} className="mt-2">
                    Clear Signature
                  </Button>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Submit Inspection
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

