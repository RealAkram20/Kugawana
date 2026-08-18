<?php

namespace Database\Seeders;

use App\Models\Faq;
use App\Models\SupportContact;
use App\Models\SupportPage;
use Illuminate\Database\Seeder;

/**
 * Starting content for Help & Support. Everything here is editable from the admin
 * panel — this only makes sure a fresh install shows something useful. Uses
 * firstOrCreate throughout so re-seeding never overwrites an admin's edits.
 */
class SupportSeeder extends Seeder
{
    public function run(): void
    {
        $contact = SupportContact::current();

        if (blank($contact->email)) {
            $contact->update([
                'intro' => "We're here to help. Reach out any time and our team will get back to you.",
                'email' => 'support@kugawana.app',
                'phone' => '+256 700 000 000',
                'whatsapp' => '256700000000',
                'hours' => 'Mon–Fri, 9am–5pm',
            ]);
        }

        $faqs = [
            [
                'question' => 'How do I share food?',
                'answer' => "Open the Share tab and describe what you are giving away — a photo, the amount, and where it can be collected.\n\nOnce an admin approves it, your listing appears in the app and nearby members can request it.",
            ],
            [
                'question' => 'How do points work?',
                'answer' => "Points are the app's way of keeping requests fair. You spend points when you request food, and you earn them by sharing food with others.\n\nYou can also top up points from Profile > Wallet.",
            ],
            [
                'question' => 'Why was my listing not approved?',
                'answer' => "Listings are checked before they go live, mostly for food safety. Items that are past their date, unsealed, or unclear in the photo are usually declined.\n\nIf you think something was declined by mistake, report a problem and we will take another look.",
            ],
            [
                'question' => 'How do I collect food I requested?',
                'answer' => "Go to Profile > My Requests. Once your request is accepted you will see the pickup time and a button to contact the person sharing.\n\nMark the request completed after you have collected it.",
            ],
            [
                'question' => 'How do reviews work?',
                'answer' => "After a request is completed, the person who received the food can leave a star rating and a comment.\n\nReviews are attached to the food you shared, so they appear on your profile. You can read yours under Profile > My Reviews.",
            ],
            [
                'question' => 'How do I change my language?',
                'answer' => 'Open Profile and tap Language. Kugawana is available in English, Kiswahili and French.',
            ],
        ];

        foreach ($faqs as $index => $faq) {
            Faq::firstOrCreate(
                ['question' => $faq['question']],
                [
                    'answer' => $faq['answer'],
                    'sort_order' => $index + 1,
                    'is_published' => true,
                ]
            );
        }

        $pages = [
            [
                'slug' => 'terms',
                'title' => 'Terms of use',
                'body' => "By using Kugawana you agree to share food honestly and to treat other members with respect.\n\nFood you list must be safe to eat. Describe it accurately, including the amount and how long it will stay good. Do not list anything that is spoiled, past its date, or that you would not eat yourself.\n\nRequests are made in good faith. If you request food, collect it at the agreed time or cancel so someone else can take it.\n\nPoints have no cash value and cannot be transferred between accounts or refunded once spent.\n\nAccounts that repeatedly waste other members' time, list unsafe food, or abuse other members may be suspended.\n\nThese terms may change as the service grows. We will update this page when they do.",
            ],
            [
                'slug' => 'privacy',
                'title' => 'Privacy policy',
                'body' => "We collect only what the service needs to work: your name, contact details, district, and the listings, requests and reviews you create.\n\nYour name, photo, district and reviews are visible to other members. Your phone number is shared only with the member you are arranging a collection with.\n\nWe do not sell your data, and we do not share it with advertisers.\n\nPayment details for point top-ups are handled by our payment provider. We never see or store your card or mobile money credentials.\n\nYou can edit your details any time under Profile > Edit profile. To have your account and data deleted, contact us using the details on the Help & Support screen.",
            ],
        ];

        foreach ($pages as $index => $page) {
            SupportPage::firstOrCreate(
                ['slug' => $page['slug']],
                [
                    'title' => $page['title'],
                    'body' => $page['body'],
                    'sort_order' => $index + 1,
                    'is_published' => true,
                ]
            );
        }
    }
}
