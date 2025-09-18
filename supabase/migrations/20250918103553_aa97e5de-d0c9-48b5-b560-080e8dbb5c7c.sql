-- Create purchase_requests table for company credit requests
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  total_cost NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase requests
CREATE POLICY "Buyers can create requests" 
ON public.purchase_requests 
FOR INSERT 
WITH CHECK (auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE profiles.id = purchase_requests.buyer_id));

CREATE POLICY "Buyers can view their own requests" 
ON public.purchase_requests 
FOR SELECT 
USING (auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE profiles.id = purchase_requests.buyer_id));

CREATE POLICY "Users can view requests for their projects" 
ON public.purchase_requests 
FOR SELECT 
USING (auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE profiles.id = (SELECT projects.owner_id FROM projects WHERE projects.id = purchase_requests.project_id)));

CREATE POLICY "Project owners can update requests" 
ON public.purchase_requests 
FOR UPDATE 
USING (auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE profiles.id = (SELECT projects.owner_id FROM projects WHERE projects.id = purchase_requests.project_id)));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_purchase_requests_updated_at
BEFORE UPDATE ON public.purchase_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();