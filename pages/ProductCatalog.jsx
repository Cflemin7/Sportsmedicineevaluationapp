
import React, { useState, useEffect, useCallback } from 'react';
import { SKU } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Predefined product catalog (same as in NewEvaluation)
const capitalEquipment = [
  { code: "934026", description: "MX AC ZOOM COUPLER EVAL KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934186", description: "5.5MM-45-430 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934189", description: "10MM-45-450 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "901168", description: "VAPR VUE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "901265", description: "FMS VUE REMOTE ONLY KIT-MX", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "901268", description: "FMS VUE 2 REMOTE 2 HP KIT- MX", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "901296", description: "MX-PRINTER & PAPER EVAL KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930171", description: "MX-FMS VUE 2-FIELD KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930188", description: "MICRO HP 2.0 NO BUTTONS-MX", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930189", description: "MICRO HP 2.0 BUTTONS-MX", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930329", description: "MX-DPS VISUALIZATION SCOPETRAY", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930330", description: "MX-DPS RECTANGULAR CAMERA TRAY", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930332", description: "MX-5.9,30,167 SNGL SC MIT SHTH", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930334", description: "MX-5.9,70,167 SNGL SC MIT SHTH", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930335", description: "MX-4.0,167 MIT TROCAR BUTTON", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930336", description: "MX-5.9,30,270 SING SC MIT SHTH", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930337", description: "MX-4.0,270 MIT TROCAR BUTTON", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930338", description: "MX-5.9,70,270 SING SC MIT SHTH", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930339", description: "MX-4.0,175 STORZ TROCAR BUTTON", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930340", description: "MX-2.7,75 STORZ TROCAR BUTTON", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930341", description: "MX-1.9,60 STORZ TROCAR BUTTON", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930342", description: "MX-OLYM-ACMI 5.0 3M LG EVALKIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "930343", description: "MX-UNIV 5.0 3M LG EVAL KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "932012", description: "MX COUPLER, 19MM AUTOCLAVE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "932013", description: "MX COUPLER, 22MM AUTOCLAVE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "932014", description: "MX EVO4K KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "933642", description: "MX 1.9-30-60 SCP STORZ KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "933644", description: "MX 2.7-30-75 SCP STORZ KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "933656", description: "MX 4.0-0-167 SCP MITEK KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "933657", description: "MX 4.0-30-167 SCP MITEK KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "933658", description: "MX 4.0-45-167 SCP MITEK KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "933659", description: "MX 4.0-70-167 SCP MITEK KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "933660", description: "MX 4.0-30-270 SCP MITEK KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "933661", description: "MX 4.0-70-270 SCP MITEK KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934012", description: "MX PUREVUE 4K/CO2 TOWER KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934013", description: "MX PUREVUE 4K BASE TOWER KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934016", description: "MX PUREVUE 4K 2ND TOWER KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934019", description: "MX PUREVUE CCS EVAL KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934022", description: "MX PUREVUE CAMERA EVAL KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934024", description: "MX NDS 4K DISPLAY EVAL KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934029", description: "MX4K CMNT SCP 4.0MM 30", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934031", description: "UNV 3.5 3M LGHT CBLEVAL KIT-MX", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934033", description: "OLYM-ACMI 3.5 3M LG EVALKIT-MX", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934034", description: "OLYM-ACMI 3.5 4M LG EVALKIT-MX", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934036", description: "FMS VUE REFRESH KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934037", description: "MX4K CMNT SCP 4.0MM 70", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934072", description: "MXHD CMNT SCP 1.9MM 30", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934115", description: "MXHD CMNT SCP 2.7 MM 30", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934142", description: "5.5MM-0-300 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934143", description: "5.5MM-30-300 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934144", description: "5.5MM-45-300 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934145", description: "10MM-0-330 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934146", description: "10MM-30-330 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934153", description: "MXHD EPSCP 1.9MM 30", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934163", description: "MXHD EPSCP 2.7 MM 30", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934176", description: "MX AIO BETA PUREVUE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934177", description: "MX INSUFFLATOR KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934183", description: "10MM-45-330 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934184", description: "5.5MM-0-430 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934185", description: "5.5MM-30-430 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934187", description: "10MM-0-450 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934188", description: "10MM-30-450 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934189", description: "10MM-45-450 LAP SCOPE KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934194", description: "MX SQ AUTOCLAVE TRAY KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934240", description: "MX SGL STPCK SHTH 4.0 167MM UN", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934343", description: "MX LG-LS ADPT ACMI UNITIP", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934344", description: "MX LG-LS ADPT OLY UNIVTIP", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934351", description: "MX LG-LS ADPT STRZ UNIVTIP", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934352", description: "MX LG-LS ADPT WLF UNITIP", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934353", description: "MX LG-SCP ADPT STRZ/OLY UNITIP", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934354", description: "MX LG-SCP ADPT WLF UNTP", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934355", description: "MX LG-SCP ADAPT ACMI UNITIP", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934358", description: "PUREVUE Quick Connect Cannula \"Bridge\" System", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934359", description: "PUREVUE Quick Connect \"Bridge\" System Tray", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934621", description: "MX OPTICS EVAL KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934935", description: "SHOULDER AND KNEE CASE", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934936", description: "HIP CASE", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934937", description: "SMALL JOINT CASE", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934018", description: "PUREVUE 4K MKTG BASE TOWER", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934270", description: "MXDUAL STPCCKSHEATH 4.0MM167MM", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934298", description: "MX BUTTON OBTURATOR 1.9MM 60MM", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934299", description: "MX BUTTON OBTURATOR 2.7MM 75MM", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934334", description: "MX BUTTON OBTURATOR 4.0MM167MM", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934939", description: "C-MOUNT SCOPES CASE", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934995", description: "MX 4K EPSCP 4.0 30", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934996", description: "MX 4K EPSCP 4.0 70", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934997", description: "MX HD CMNTSCP 3.5 30", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934998", description: "MX HD CMNTSCP 3.5 70", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934999", description: "MX HD EPSCP 3.5 30", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true },
  { code: "934195", description: "MX C-MOUNT WRENCH KIT", category: "capital_equipment", quantity: 1, unit_price: 0, reprocessable: true }
];

const disposableProducts = [
  // VAPR PRODUCTS
  { code: "225028", description: "VAPR TRIPOLAR 90 Suction Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225029", description: "VAPR ARCTIC® Suction Electrode with Dome Tip", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225030", description: "VAPR ARCTIC Suction Electrode with Chisel Tip", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225031", description: "COOLPULSE Curve", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225032", description: "COOLPULSE Curve XL", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225201", description: "2.3mm Side Effect Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225202", description: "2.3mm End Effect Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225203", description: "2.3mm Wedge Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225211", description: "2.3mm Short Side Effect Electrode, 85mm", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225213", description: "2.3mm Short Wedge Electrode, 85mm", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225252", description: "2.3mm TC (Temperature Control) Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225301", description: "Side Effect Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225302", description: "Angled Side Effect Electrode, 21°", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225303", description: "Straight End Effect Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225304", description: "Angled End Effect Electrode, 21°", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225305", description: "Hook Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225312", description: "Flexible Side Effect Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225314", description: "Flexible End Effect Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "225370", description: "S90 Suction Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227202", description: "2.3mm End Effect Electrode with Integrated Handpiece", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227203", description: "2.3mm Wedge Electrode with Integrated Handpiece", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227204", description: "Premiere 90 Suction Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227211", description: "2.3mm Short Side Effect Electrode with Integrated Handpiece", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227213", description: "2.3mm Short Wedge with Integrated Handpiece", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227214", description: "VAPR VUE System Wireless Footswitch", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227252", description: "VAPR TC (Temperature Control) Electrode with Integrated Handpiece", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227301", description: "Side Effect Electrode with Integrated Handpiece", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227302", description: "Angled Side Effect Electrode, 21°, with Integrated Handpiece", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227305", description: "Hook Electrode with Integrated Handpiece", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227312", description: "Flexible Side Effect Electrode with Integrated Handpiece", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227355", description: "S50 Angled Suction Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "227504", description: "Premiere 50 Suction Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "228146", description: "COOLPULSE® 90 Suction Electrode", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "228147", description: "COOLPULSE 90 Suction Electrode with Hand Controls", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "228203", description: "2.3mm Wedge Electrode with Hand Controls", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "228300", description: "Side Effect Electrode with Hand Controls", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "228305", description: "Hook Electrode with Hand Controls", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "228370", description: "S90 Suction Electrode with Hand Controls", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "228504", description: "Premiere 50 Suction Electrode with Hand Controls", category: "disposable", product_family: "VAPR", quantity: 1, unit_price: 0, reprocessable: false },
  // FMS PUMP PRODUCTS
  { code: "281103", description: "Intermediary Tubing without One Way Valve (Disposable Setup)", category: "disposable", product_family: "FMS Pump", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "281113", description: "Gravity Tubing", category: "disposable", product_family: "FMS Pump", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "281142", description: "Intermediary Tubing with One Way Valve (Reusable Setup)", category: "disposable", product_family: "FMS Pump", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "281380", description: "10L Waste Collection Bag", category: "disposable", product_family: "FMS Pump", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "281572", description: "FMS Suction cannula 2.5mm (sterile, single use, box of 20)", category: "disposable", product_family: "FMS Pump", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "281580", description: "FMS Suction cannula 4.5mm (sterile, single use, box of 20)", category: "disposable", product_family: "FMS Pump", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "284508", description: "Inflow Tubing (FMS VUE System)", category: "disposable", product_family: "FMS Pump", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "284610", description: "Outflow Tubing without One Way Valve (Disposable Setup)", category: "disposable", product_family: "FMS Pump", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "284649", description: "Outflow Tubing with One Way Valve (Reusable Setup)", category: "disposable", product_family: "FMS Pump", quantity: 1, unit_price: 0, reprocessable: false },
  // FMS SHAVER PRODUCTS
  { code: "283055", description: "2.0mm Mini Round Tornado Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283209", description: "2.7mm Mini Full Radius Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283229", description: "2.7mm Mini Ultra Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283255", description: "3.0mm Mini Round Tornado Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283309", description: "3.5mm Full Radius Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283319", description: "3.5mm Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283329", description: "3.5mm Ultra Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283345", description: "4.2mm OMNICUT™ Resection Blade", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283346", description: "5.2mm OMNICUT Resection Blade", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283403", description: "4.2mm Curved Full Radius Blade", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283404", description: "4.2mm XL Curved Full Radius Blade", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283408", description: "4.2mm XL Full Radius Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283409", description: "4.0mm Full Radius Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283411", description: "4.2mm XL Curved Aggressive Blade", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283412", description: "4.2mm Curved Aggressive Blade", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283418", description: "4.2mm XL Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283419", description: "4.0mm Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283421", description: "4.2mm XL Curved Ultra Aggressive Blade", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283422", description: "4.2mm Curved Ultra Aggressive Blade", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283428", description: "4.2mm XL Ultra Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283429", description: "4.0mm Ultra Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283431", description: "4.2mm XL Multi Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283432", description: "4.2mm Curved Multi Blade", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283433", description: "4.2mm XL Curved Ultra Multi Blade", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283439", description: "4.0mm Multi Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283458", description: "4.0mm XL Round Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283459", description: "4.0mm Round Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283469", description: "4.0mm Barrel Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283478", description: "4.0mm XL Round Tornado Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283479", description: "4.0mm Round Tornado Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283489", description: "4.0mm Barrel Tornado Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283609", description: "3.5mm Mini Full Radius Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283619", description: "3.5mm Mini Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283629", description: "3.5mm Mini Ultra Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283709", description: "5.0mm Full Radius Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283719", description: "5.0mm Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283729", description: "5.0mm Ultra Aggressive Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283739", description: "5.0mm Multi Blade Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283858", description: "5.0mm XL Round Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283859", description: "5.0mm Round Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283869", description: "5.0mm Barrel Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283878", description: "5.0mm XL Round Tornado Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283879", description: "5.0mm Round Tornado Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "283889", description: "5.0mm Barrel Tornado Burr Plus", category: "disposable", product_family: "FMS Shaver", quantity: 1, unit_price: 0, reprocessable: false },
  // INSUFFLATOR PRODUCTS
  { code: "222702", description: "Tube Set for Insufflation, Single-Use (20 Pieces per Box)", category: "disposable", product_family: "Insufflator", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "222703", description: "Heated Tube Set for Insufflation, Single-Use (10 Pieces per Box)", category: "disposable", product_family: "Insufflator", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "222705", description: "DISS Adapter for Universal Gas Connector", category: "disposable", product_family: "Insufflator", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "222707", description: "Sinter Filter for Universal Gas Connector (5 pieces)", category: "disposable", product_family: "Insufflator", quantity: 1, unit_price: 0, reprocessable: false },
  // OTHER PRODUCTS
  { code: "284156", description: "Large Foot Pedal Cover", category: "disposable", product_family: "Other", quantity: 1, unit_price: 0, reprocessable: false },
  { code: "284163", description: "Small Foot Pedal Cover", category: "disposable", product_family: "Other", quantity: 1, unit_price: 0, reprocessable: false },
];

// Combine predefined products
const predefinedProducts = [...capitalEquipment, ...disposableProducts].map(product => ({
  id: `predefined-${product.code}`,
  sku_code: product.code,
  product_name: product.description,
  category: product.category,
  product_family: product.product_family || null,
  unit_price: product.unit_price, // Still include in data, but not displayed
  reprocessable: product.reprocessable,
  requires_training: false,
  availability_status: 'available',
  description: product.description
}));

export default function ProductCatalog() {
  const [dbProducts, setDbProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('all');

  const loadProducts = async () => {
    try {
      // Load products from database
      const data = await SKU.list('-created_date');
      setDbProducts(data);
      
      // Combine predefined products with database products
      // Remove duplicates by SKU code (database products take precedence)
      const dbSkuCodes = new Set(data.map(p => p.sku_code));
      const uniquePredefined = predefinedProducts.filter(p => !dbSkuCodes.has(p.sku_code));
      const combined = [...data, ...uniquePredefined];
      
      setAllProducts(combined);
    } catch (error) {
      console.error('Error loading products:', error);
      // If database fails, at least show predefined products
      setAllProducts(predefinedProducts);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = useCallback(() => {
    let filtered = allProducts;

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (familyFilter !== 'all') {
      filtered = filtered.filter(product => product.product_family === familyFilter);
    }

    setFilteredProducts(filtered);
  }, [allProducts, searchTerm, categoryFilter, familyFilter]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const productFamilies = [...new Set(allProducts.map(p => p.product_family).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-gray-600">Browse all available SKUs and products</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              All Products ({filteredProducts.length})
            </CardTitle>
            <div className="flex gap-4 w-full md:w-auto flex-wrap">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="capital_equipment">Capital Equipment</SelectItem>
                  <SelectItem value="disposable">Disposables</SelectItem>
                </SelectContent>
              </Select>
              <Select value={familyFilter} onValueChange={setFamilyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Families</SelectItem>
                  {productFamilies.map(family => (
                    <SelectItem key={family} value={family}>{family}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Product Family</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Features</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No products found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm font-medium">
                        {product.sku_code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.product_name}</div>
                          {product.description && product.description !== product.product_name && (
                            <div className="text-sm text-gray-600 mt-1 max-w-xs truncate">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.category === 'capital_equipment' ? 'default' : 'secondary'}>
                          {product.category === 'capital_equipment' ? 'Capital' : 'Disposable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.product_family && (
                          <Badge variant="outline">{product.product_family}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          product.availability_status === 'available' ? 'default' :
                          product.availability_status === 'limited' ? 'secondary' : 'destructive'
                        }>
                          {product.availability_status || 'available'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {product.reprocessable && (
                            <Badge variant="outline" className="text-xs">Reprocessable</Badge>
                          )}
                          {product.requires_training && (
                            <Badge variant="outline" className="text-xs">Training Required</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
