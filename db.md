-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.campaign_documents (
  id integer NOT NULL DEFAULT nextval('campaign_documents_id_seq'::regclass),
  campaign_address character varying NOT NULL CHECK (campaign_address::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  name character varying NOT NULL,
  description text,
  category character varying DEFAULT 'other'::character varying CHECK (category::text = ANY (ARRAY['whitepaper'::character varying, 'financial'::character varying, 'legal'::character varying, 'technical'::character varying, 'marketing'::character varying, 'other'::character varying]::text[])),
  ipfs_hash text NOT NULL,
  url text,
  file_size bigint,
  is_public boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  uploaded_by character varying CHECK (uploaded_by IS NULL OR uploaded_by::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaign_documents_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_documents_campaign_address_fkey FOREIGN KEY (campaign_address) REFERENCES public.campaigns(address)
);
CREATE TABLE public.campaign_events (
  id integer NOT NULL DEFAULT nextval('campaign_events_id_seq'::regclass),
  campaign_address character varying,
  event_type character varying NOT NULL,
  tx_hash character varying NOT NULL CHECK (tx_hash::text ~ '^0x[a-fA-F0-9]{64}$'::text),
  block_number bigint NOT NULL,
  block_timestamp bigint NOT NULL,
  log_index integer NOT NULL,
  event_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaign_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.campaign_investors (
  id integer NOT NULL DEFAULT nextval('campaign_investors_id_seq'::regclass),
  campaign_address character varying NOT NULL CHECK (campaign_address::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  investor_address character varying NOT NULL CHECK (investor_address::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  total_shares character varying DEFAULT '0'::character varying,
  total_invested character varying DEFAULT '0'::character varying,
  first_investment_date timestamp with time zone,
  last_investment_date timestamp with time zone,
  investment_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaign_investors_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_investors_campaign_address_fkey FOREIGN KEY (campaign_address) REFERENCES public.campaigns(address)
);
CREATE TABLE public.campaign_promotions (
  id integer NOT NULL DEFAULT nextval('campaign_promotions_id_seq'::regclass),
  tx_hash character varying NOT NULL UNIQUE CHECK (tx_hash::text ~ '^0x[a-fA-F0-9]{64}$'::text),
  campaign_address character varying NOT NULL CHECK (campaign_address::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  creator character varying NOT NULL CHECK (creator::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  boost_type character varying NOT NULL CHECK (boost_type::text = ANY (ARRAY['featured'::character varying, 'trending'::character varying, 'spotlight'::character varying]::text[])),
  round_number integer NOT NULL,
  eth_amount character varying NOT NULL,
  start_timestamp timestamp with time zone NOT NULL,
  end_timestamp timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  block_number bigint NOT NULL,
  CONSTRAINT campaign_promotions_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_promotions_campaign_address_fkey FOREIGN KEY (campaign_address) REFERENCES public.campaigns(address)
);
CREATE TABLE public.campaign_rounds (
  id integer NOT NULL DEFAULT nextval('campaign_rounds_id_seq'::regclass),
  campaign_address character varying NOT NULL CHECK (campaign_address::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  round_number integer NOT NULL,
  share_price character varying NOT NULL,
  target_amount character varying NOT NULL,
  funds_raised character varying DEFAULT '0'::character varying,
  shares_sold character varying DEFAULT '0'::character varying,
  start_time bigint,
  end_time bigint,
  is_active boolean DEFAULT true,
  is_finalized boolean DEFAULT false,
  start_block bigint,
  end_block bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaign_rounds_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_rounds_campaign_address_fkey FOREIGN KEY (campaign_address) REFERENCES public.campaigns(address)
);
CREATE TABLE public.campaign_transactions (
  tx_hash character varying NOT NULL CHECK (tx_hash::text ~ '^0x[a-fA-F0-9]{64}$'::text),
  campaign_address character varying NOT NULL CHECK (campaign_address::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  investor character varying NOT NULL CHECK (investor::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  amount character varying DEFAULT '0'::character varying,
  shares character varying DEFAULT '0'::character varying,
  round_number integer DEFAULT 1,
  type character varying NOT NULL DEFAULT 'purchase'::character varying CHECK (type::text = ANY (ARRAY['purchase'::character varying, 'refund'::character varying, 'dividend'::character varying, 'commission'::character varying]::text[])),
  block_number bigint NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  commission character varying DEFAULT '0'::character varying,
  net_amount character varying DEFAULT '0'::character varying,
  transaction_index integer,
  gas_used bigint,
  gas_price character varying,
  CONSTRAINT campaign_transactions_pkey PRIMARY KEY (tx_hash),
  CONSTRAINT campaign_transactions_campaign_address_fkey FOREIGN KEY (campaign_address) REFERENCES public.campaigns(address)
);
CREATE TABLE public.campaigns (
  address character varying NOT NULL CHECK (address::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  creator character varying NOT NULL CHECK (creator::text ~ '^0x[a-fA-F0-9]{40}$'::text),
  name character varying NOT NULL,
  symbol character varying NOT NULL,
  category character varying,
  logo text,
  metadata_uri text,
  goal character varying NOT NULL DEFAULT '0'::character varying,
  raised character varying NOT NULL DEFAULT '0'::character varying,
  share_price character varying NOT NULL DEFAULT '0'::character varying,
  shares_sold character varying NOT NULL DEFAULT '0'::character varying,
  total_shares character varying NOT NULL DEFAULT '0'::character varying,
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'ended'::character varying, 'finalized'::character varying, 'upcoming'::character varying]::text[])),
  is_active boolean NOT NULL DEFAULT true,
  is_finalized boolean NOT NULL DEFAULT false,
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  current_round integer NOT NULL DEFAULT 1,
  last_synced_block bigint DEFAULT 0,
  total_investors integer DEFAULT 0,
  progress_percentage numeric DEFAULT 0,
  description text,
  nft_background_color character varying DEFAULT '#0f172a'::character varying,
  nft_text_color character varying DEFAULT '#FFFFFF'::character varying,
  nft_logo_url text,
  nft_sector character varying,
  round_share_price character varying,
  round_target_amount character varying,
  round_end_time bigint,
  round_is_active boolean DEFAULT true,
  round_is_finalized boolean DEFAULT false,
  total_transactions integer DEFAULT 0,
  unique_investors integer DEFAULT 0,
  creation_timestamp bigint,
  creation_block bigint,
  full_sync_done boolean DEFAULT false,
  last_full_sync timestamp with time zone,
  CONSTRAINT campaigns_pkey PRIMARY KEY (address)
);
CREATE TABLE public.livar_contract_state (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contract_name text NOT NULL,
  chain_id bigint,
  address text,
  status text NOT NULL DEFAULT 'unknown'::text CHECK (status = ANY (ARRAY['ok'::text, 'warning'::text, 'error'::text, 'unknown'::text])),
  detail text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT livar_contract_state_pkey PRIMARY KEY (id)
);
CREATE TABLE public.livar_dashboard_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  source text,
  level text CHECK (level = ANY (ARRAY['info'::text, 'warn'::text, 'error'::text])),
  message text NOT NULL,
  context jsonb,
  CONSTRAINT livar_dashboard_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.promotion_analytics (
  id bigint NOT NULL DEFAULT nextval('promotion_analytics_id_seq'::regclass),
  date date NOT NULL,
  total_promotions integer DEFAULT 0,
  total_revenue_eth numeric DEFAULT 0,
  featured_count integer DEFAULT 0,
  trending_count integer DEFAULT 0,
  spotlight_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT promotion_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sync_state (
  id character varying NOT NULL,
  last_block bigint NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  error_count integer DEFAULT 0,
  last_error text,
  last_success_at timestamp with time zone,
  CONSTRAINT sync_state_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  id bigint NOT NULL DEFAULT nextval('transactions_id_seq'::regclass),
  campaign_address text NOT NULL,
  transaction_hash text NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  token_id text NOT NULL,
  amount_eth text NOT NULL,
  block_number bigint,
  timestamp timestamp with time zone,
  type text DEFAULT 'purchase'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id)
);



-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE storage.buckets (
  id text NOT NULL,
  name text NOT NULL,
  owner uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types ARRAY,
  owner_id text,
  type USER-DEFINED NOT NULL DEFAULT 'STANDARD'::storage.buckettype,
  CONSTRAINT buckets_pkey PRIMARY KEY (id)
);
CREATE TABLE storage.buckets_analytics (
  name text NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'ANALYTICS'::storage.buckettype,
  format text NOT NULL DEFAULT 'ICEBERG'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  deleted_at timestamp with time zone,
  CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE storage.buckets_vectors (
  id text NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'VECTOR'::storage.buckettype,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id)
);
CREATE TABLE storage.migrations (
  id integer NOT NULL,
  name character varying NOT NULL UNIQUE,
  hash character varying NOT NULL,
  executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE storage.objects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_accessed_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  path_tokens ARRAY DEFAULT string_to_array(name, '/'::text),
  version text,
  owner_id text,
  user_metadata jsonb,
  level integer,
  CONSTRAINT objects_pkey PRIMARY KEY (id),
  CONSTRAINT objects_bucketId_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);
CREATE TABLE storage.prefixes (
  bucket_id text NOT NULL,
  name text NOT NULL,
  level integer NOT NULL DEFAULT storage.get_level(name),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name),
  CONSTRAINT prefixes_bucketId_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);
CREATE TABLE storage.s3_multipart_uploads (
  id text NOT NULL,
  in_progress_size bigint NOT NULL DEFAULT 0,
  upload_signature text NOT NULL,
  bucket_id text NOT NULL,
  key text NOT NULL,
  version text NOT NULL,
  owner_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_metadata jsonb,
  CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id),
  CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);
CREATE TABLE storage.s3_multipart_uploads_parts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  upload_id text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  part_number integer NOT NULL,
  bucket_id text NOT NULL,
  key text NOT NULL,
  etag text NOT NULL,
  owner_id text,
  version text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id),
  CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id),
  CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);
CREATE TABLE storage.vector_indexes (
  id text NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bucket_id text NOT NULL,
  data_type text NOT NULL,
  dimension integer NOT NULL,
  distance_metric text NOT NULL,
  metadata_configuration jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vector_indexes_pkey PRIMARY KEY (id),
  CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id)
);