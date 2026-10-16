import { AuditBlock, ClinicalScope, UserRole, UserSession, TenantId } from '../types';

/**
 * Computes a SHA-256 digest string from an input text using the Web Crypto API
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous lightweight fallback hash for immediate UI operations if needed
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Computes canonical block hash for an audit ledger block
 */
export async function computeBlockHash(
  blockIndex: number,
  prevHash: string,
  timestamp: string,
  actorId: string,
  actorRole: string,
  action: string,
  resourceId: string,
  payloadSummary: string
): Promise<string> {
  const canonicalString = `${blockIndex}|${prevHash}|${timestamp}|${actorId}|${actorRole}|${action}|${resourceId}|${payloadSummary}`;
  return sha256(canonicalString);
}

/**
 * Verifies the integrity of an audit chain. Returns true if valid, or the index of the first corrupted block.
 */
export async function verifyAuditChain(blocks: AuditBlock[]): Promise<{ isValid: boolean; brokenIndex?: number; error?: string }> {
  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];
    
    // Check previous hash link
    if (i > 0) {
      const prev = blocks[i - 1];
      if (current.previousHash !== prev.currentHash) {
        return {
          isValid: false,
          brokenIndex: i,
          error: `Block #${current.blockIndex} previousHash does not match Block #${prev.blockIndex} currentHash! [TAMPER DETECTED]`
        };
      }
    } else {
      if (current.previousHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
        return {
          isValid: false,
          brokenIndex: 0,
          error: `Genesis Block #0 has an invalid genesis pointer.`
        };
      }
    }

    // Verify self-hash
    const expectedHash = await computeBlockHash(
      current.blockIndex,
      current.previousHash,
      current.timestamp,
      current.actorId,
      current.actorRole,
      current.action,
      current.resourceId,
      current.payloadSummary
    );

    if (current.currentHash !== expectedHash) {
      return {
        isValid: false,
        brokenIndex: i,
        error: `Block #${current.blockIndex} payload integrity broken! Computed: ${expectedHash.slice(0, 12)}... Stored: ${current.currentHash.slice(0, 12)}...`
      };
    }
  }

  return { isValid: true };
}

/**
 * Granular RBAC Role-to-Scope Definition Matrix
 * Enforces SLO #1: Absolute role isolation
 */
export const ROLE_PERMISSIONS: Record<UserRole, {
  title: string;
  department: string;
  allowedScopes: ClinicalScope[];
  restrictedScopes: ClinicalScope[];
  description: string;
}> = {
  triage_nurse: {
    title: 'Triage Nurse / Reception Intake',
    department: 'Emergency & Ambulatory Triage',
    allowedScopes: ['triage:intake'],
    restrictedScopes: ['emr:read_diagnostics', 'emr:write_encounter', 'rx:prescribe', 'pharmacy:dispense', 'billing:reconcile', 'audit:read', 'tenant:manage'],
    description: 'Captures acuity scores & vital signs. Strictly isolated from billing cash drawers and confidential clinician psychiatric notes.'
  },
  clinician_doctor: {
    title: 'Attending Clinician / Physician',
    department: 'Inpatient & Specialty Medicine',
    allowedScopes: ['emr:read_diagnostics', 'emr:write_encounter', 'rx:prescribe', 's3:generate_presigned_url'],
    restrictedScopes: ['pharmacy:dispense', 'billing:reconcile', 'tenant:manage'],
    description: 'Full EMR access, SOAP clinical encounters, orders prescriptions and imaging. Cannot dispense medications or manipulate revenue reconciliation.'
  },
  pharmacist: {
    title: 'Clinical Pharmacist / Dispenser',
    department: 'Hospital Pharmacy & Dispensary',
    allowedScopes: ['pharmacy:dispense', 's3:generate_presigned_url'],
    restrictedScopes: ['emr:read_diagnostics', 'emr:write_encounter', 'rx:prescribe', 'billing:reconcile', 'tenant:manage'],
    description: 'Verifies physician-signed prescriptions, screens allergy contraindications, dispenses drugs. Zero access to billing ledgers or full diagnostic write-ups.'
  },
  billing_cashier: {
    title: 'Revenue Cycle Specialist / Cashier',
    department: 'Patient Accounts & Billing',
    allowedScopes: ['billing:reconcile'],
    restrictedScopes: ['emr:read_diagnostics', 'emr:write_encounter', 'rx:prescribe', 'pharmacy:dispense', 's3:generate_presigned_url', 'tenant:manage'],
    description: 'Adjudicates claims and collects fees via CPT/ICD charge codes. CONFIDENTIAL DIAGNOSTIC CLINICAL NOTES ARE HARD-REDACTED AT API LAYER.'
  },
  compliance_auditor: {
    title: 'HIPAA Compliance & Security Auditor',
    department: 'Risk Management & Security',
    allowedScopes: ['audit:read', 'audit:verify', 'tenant:manage'],
    restrictedScopes: ['emr:write_encounter', 'rx:prescribe', 'pharmacy:dispense', 'billing:reconcile'],
    description: 'Inspects immutable SHA-256 audit ledger, audits cryptographic chain links, validates tenant-level isolation invariants.'
  }
};

/**
 * Pre-defined mock users for fast switching during technical walkthrough
 */
export const DEFAULT_USERS: Record<UserRole, UserSession> = {
  triage_nurse: {
    id: 'usr_triage_901',
    name: 'Nurse Elena Rostova, RN',
    role: 'triage_nurse',
    title: 'Senior Triage Specialist',
    badgeNumber: 'RN-88219',
    tenantId: 'metro-gen',
    scopes: ['triage:intake'],
    avatar: 'ER'
  },
  clinician_doctor: {
    id: 'usr_doc_304',
    name: 'Dr. Marcus Vance, MD, FACC',
    role: 'clinician_doctor',
    title: 'Attending Cardiologist & EMR Lead',
    badgeNumber: 'MD-44012',
    tenantId: 'metro-gen',
    scopes: ['emr:read_diagnostics', 'emr:write_encounter', 'rx:prescribe', 's3:generate_presigned_url'],
    avatar: 'MV'
  },
  pharmacist: {
    id: 'usr_pharm_512',
    name: 'Dr. Priya Chen, PharmD',
    role: 'pharmacist',
    title: 'Chief Clinical Pharmacist',
    badgeNumber: 'RPH-61904',
    tenantId: 'metro-gen',
    scopes: ['pharmacy:dispense', 's3:generate_presigned_url'],
    avatar: 'PC'
  },
  billing_cashier: {
    id: 'usr_bill_108',
    name: 'David O\'Connor',
    role: 'billing_cashier',
    title: 'Revenue Cycle Officer',
    badgeNumber: 'RCO-10294',
    tenantId: 'metro-gen',
    scopes: ['billing:reconcile'],
    avatar: 'DO'
  },
  compliance_auditor: {
    id: 'usr_audit_001',
    name: 'Sarah Lindqvist, CISSP',
    role: 'compliance_auditor',
    title: 'Lead Security & HIPAA Auditor',
    badgeNumber: 'SEC-99001',
    tenantId: 'metro-gen',
    scopes: ['audit:read', 'audit:verify', 'tenant:manage'],
    avatar: 'SL'
  }
};

export const CLINIC_TENANTS: { id: TenantId; name: string; type: string; city: string; activeClinicians: number; totalRooms: number }[] = [
  {
    id: 'metro-gen',
    name: 'Metro General Hospital (HQ)',
    type: 'Level 1 Trauma & Tertiary Inpatient',
    city: 'Metro Center',
    activeClinicians: 48,
    totalRooms: 12
  },
  {
    id: 'westside-spec',
    name: 'Westside Specialty Clinic',
    type: 'Cardiology & Diagnostic Imaging Center',
    city: 'West District',
    activeClinicians: 18,
    totalRooms: 6
  },
  {
    id: 'valley-urg',
    name: 'Valley Urgent Care',
    type: 'Walk-in Ambulatory & Rapid Triage',
    city: 'Valley Heights',
    activeClinicians: 12,
    totalRooms: 4
  }
];

/**
 * Simulates generating an AWS S3 Pre-Signed URL with cryptographic signature v4
 * SLO #3: Zero-exposure direct-to-S3 ingestion
 */
export function generateMockS3PresignedUrl(
  patientId: string,
  fileName: string,
  fileType: string
): {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
  expiresAt: string;
  headers: Record<string, string>;
  curlPreview: string;
} {
  const timestamp = new Date().toISOString().replace(/[:-]/g, '').slice(0, 15) + 'Z';
  const dateStamp = timestamp.slice(0, 8);
  const region = 'us-east-1';
  const bucket = 'apexcare-pacs-vault-prod';
  const objectKey = `tenants/metro-gen/patients/${patientId}/radiology/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
  
  const amzCredential = `AKIAAPEXCARE${simpleHash(patientId)}/${dateStamp}/${region}/s3/aws4_request`;
  const signature = simpleHash(objectKey + timestamp) + simpleHash(fileName + 's3v4secret');
  
  const uploadUrl = `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(amzCredential)}&X-Amz-Date=${timestamp}&X-Amz-Expires=900&X-Amz-SignedHeaders=host;x-amz-server-side-encryption&X-Amz-Signature=${signature}`;

  const headers = {
    'Content-Type': fileType,
    'x-amz-server-side-encryption': 'AES256',
    'x-amz-meta-patient-mrn': patientId,
    'x-amz-meta-uploader-role': 'clinician_doctor'
  };

  const curlPreview = `curl -X PUT "${uploadUrl}" \\
  -H "Content-Type: ${fileType}" \\
  -H "x-amz-server-side-encryption: AES256" \\
  --upload-file ${fileName}`;

  return {
    uploadUrl,
    objectKey,
    expiresInSeconds: 900, // 15 minutes
    expiresAt: new Date(Date.now() + 900 * 1000).toISOString(),
    headers,
    curlPreview
  };
}
