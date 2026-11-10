-- ====================================================================
-- NIRAULOOM SEED DATA
-- 15 Core Categories + Subcategories + Initial Sample Creations
-- ====================================================================

-- 1. SEED CATEGORIES
insert into public.categories (id, name, description, icon, sort_order) values
('ecommerce', 'E-commerce', 'Online stores, marketplaces, direct-to-consumer platforms, and retail innovations.', 'ShoppingBag', 1),
('ai-machine-learning', 'AI & Machine Learning', 'Next-generation intelligent systems, LLMs, neural tooling, and agents.', 'Sparkles', 2),
('education', 'Education', 'EdTech platforms, interactive learning, bootcamps, and knowledge bases.', 'GraduationCap', 3),
('business-saas', 'Business & SaaS', 'Enterprise software, workflows, financial tooling, and operational platforms.', 'Briefcase', 4),
('design-creative', 'Design & Creative', 'Graphic suites, 3D tooling, animation studios, and creative inspiration.', 'Palette', 5),
('developer-tools', 'Developer Tools', 'APIs, frameworks, dev environments, cloud infrastructure, and debugging.', 'Code2', 6),
('blogs-media', 'Blogs & Media', 'Digital publications, journalism, newsletter platforms, and podcasts.', 'Newspaper', 7),
('gaming', 'Gaming', 'Web3 games, browser games, indie games, interactive engines, and streaming.', 'Gamepad2', 8),
('healthcare', 'Healthcare', 'Telehealth, mental wellness, fitness trackers, and clinical tech.', 'HeartPulse', 9),
('real-estate', 'Real Estate', 'Property search, architectural visualization, smart prop-tech, and rentals.', 'Home', 10),
('food-restaurants', 'Food & Restaurants', 'Culinary portals, recipe curators, cloud kitchens, and dining booking.', 'UtensilsCrossed', 11),
('science-technology', 'Science & Technology', 'Deep tech, aerospace, robotics, clean energy, and quantum physics.', 'Cpu', 12),
('productivity', 'Productivity', 'Note-taking, task organizers, second-brain apps, and focus aids.', 'CheckSquare', 13),
('community-social', 'Community & Social', 'Micro-communities, decentralized socials, forums, and creator clubs.', 'Users', 14),
('entertainment', 'Entertainment', 'Streaming, interactive media, audio generation, and culture showcases.', 'Film', 15)
on conflict (id) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, sort_order = excluded.sort_order;

-- 2. SEED SUBCATEGORIES (Especially E-commerce)
insert into public.subcategories (id, category_id, name, description, sort_order) values
-- E-commerce Subcategories
('d2c-brands', 'ecommerce', 'D2C Brands', 'Direct-to-consumer curated lifestyle and artisan brands.', 1),
('b2b-marketplaces', 'ecommerce', 'B2B Marketplaces', 'Wholesale, supply-chain, and corporate procurement.', 2),
('sustainable-retail', 'ecommerce', 'Sustainable Retail', 'Eco-friendly, zero-waste, and circular economy goods.', 3),
('digital-goods', 'ecommerce', 'Digital Goods & Templates', 'Fonts, design systems, 3D assets, and code templates.', 4),
('fashion-apparel', 'ecommerce', 'Fashion & Apparel', 'Independent designers, bespoke apparel, and streetwear.', 5),
('artisan-crafts', 'ecommerce', 'Artisan Crafts', 'Handcrafted items, pottery, and indie maker goods.', 6),

-- AI Subcategories
('autonomous-agents', 'ai-machine-learning', 'Autonomous Agents', 'Self-directing task execution engines.', 1),
('generative-media', 'ai-machine-learning', 'Generative Media', 'Image, video, audio, and 3D generation.', 2),
('llm-interfaces', 'ai-machine-learning', 'LLM Interfaces', 'Next-gen chat interfaces and copilots.', 3),

-- Dev Tools Subcategories
('api-platforms', 'developer-tools', 'APIs & Backend', 'Serverless APIs, databases, and microservices.', 1),
('frontend-tooling', 'developer-tools', 'Frontend Tooling', 'CSS frameworks, bundlers, and UI component sets.', 2),
('cloud-infra', 'developer-tools', 'Cloud & DevOps', 'Deployment platforms, edge networks, and observability.', 3),

-- Design Subcategories
('ui-ux-tools', 'design-creative', 'UI/UX Tools', 'Wireframing, prototyping, and design tokens.', 1),
('3d-motion', 'design-creative', '3D & Motion', 'Three.js, WebGL experiments, and animation.', 2),

-- Productivity Subcategories
('knowledge-management', 'productivity', 'Knowledge Management', 'Note taking, wikis, and markdown knowledge graphs.', 1),
('time-focus', 'productivity', 'Time & Focus', 'Pomodoro timers, flow states, and calendar blocks.', 2)
on conflict (id) do nothing;

-- 3. SEED TAGS
insert into public.tags (id, name) values
('open-source', 'Open Source'),
('free', 'Free'),
('minimalist', 'Minimalist'),
('ai-powered', 'AI Powered'),
('indie-maker', 'Indie Maker'),
('web-app', 'Web App'),
('student-built', 'Student Built'),
('design-system', 'Design System'),
('productivity', 'Productivity'),
('developer-tools', 'Developer Tools'),
('e-commerce', 'E-Commerce'),
('creative', 'Creative')
on conflict (id) do nothing;
