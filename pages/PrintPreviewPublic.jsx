import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import EvaluationPrintLayout from "../components/evaluation/EvaluationPrintLayout";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function PrintPreviewPublic() {
  const location = useLocation();
  const navigate = useNavigate();

  // Try to get payload from navigation state first, then sessionStorage
  const payload = useMemo(() => {
    if (location.state?.evaluation && location.state?.account) return location.state;
    try {
      const stored = sessionStorage.getItem("last_evaluation_payload");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [location.state]);

  if (!payload?.evaluation || !payload?.account) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Nothing to Preview</h1>
          <p className="text-gray-600 mb-6">
            We couldn’t find the evaluation data for this preview. Please create a new evaluation first.
          </p>
          <Button onClick={() => navigate(createPageUrl("NewEvaluation"))} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to New Evaluation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EvaluationPrintLayout
      evaluation={payload.evaluation}
      account={payload.account}
      products={payload.products || []}
      onClose={() => navigate(createPageUrl("NewEvaluation"))}
    />
  );
}