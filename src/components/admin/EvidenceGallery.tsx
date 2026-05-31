import { FileText, Image, ExternalLink, AlertCircle } from "lucide-react";

interface EvidenceGalleryProps {
  cids: string[];
  gatewayUrl?: string;
}

function getFileIcon(cid: string) {
  // Heuristic based on CID suffix or demo patterns
  if (cid.includes("_pdf") || cid.includes("doc")) return FileText;
  return Image;
}

function isSimulatedCid(cid: string) {
  return cid.startsWith("QmSIMULATED") || cid.startsWith("demo-") || cid.length < 20;
}

export function EvidenceGallery({ cids, gatewayUrl = "https://gateway.pinata.cloud/ipfs" }: EvidenceGalleryProps) {
  if (cids.length === 0) {
    return (
      <div className="window-lg bg-card p-6 text-center">
        <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs font-mono text-muted-foreground">No evidence files submitted</p>
      </div>
    );
  }

  return (
    <div className="window-lg bg-card p-5 space-y-3">
      <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
        Evidence Files ({cids.length})
      </h4>

      <div className="grid grid-cols-2 gap-3">
        {cids.map((cid, i) => {
          const simulated = isSimulatedCid(cid);
          const FileIcon = getFileIcon(cid);
          const url = simulated ? null : `${gatewayUrl}/${cid}`;

          return (
            <div
              key={cid}
              className="border-[1.5px] border-foreground/30 hover:border-foreground transition-smooth p-3 flex items-start gap-3"
            >
              {/* Preview area */}
              <div className="h-12 w-12 bg-muted flex items-center justify-center border-[1.5px] border-foreground/20 shrink-0">
                <FileIcon className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  File {i + 1}
                </p>
                <p className="text-[10px] font-mono text-foreground break-all mt-0.5 line-clamp-2">
                  {simulated ? (
                    <span className="italic text-muted-foreground">[Demo file — no real upload]</span>
                  ) : (
                    cid.slice(0, 20) + "..."
                  )}
                </p>

                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-[10px] font-mono text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on IPFS
                  </a>
                ) : (
                  <span className="mt-1 text-[10px] font-mono text-muted-foreground/50 italic">
                    Demo mode — IPFS not used
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
