<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\SupportContact;
use App\Models\SupportPage;
use App\Models\SupportReport;
use App\Support\AdminNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    /**
     * Everything the Help & Support screen needs in one trip: the intro blurb, the
     * ways to reach the team, the FAQ list, and the policy pages available to open.
     * Page bodies are left out here — they are long, and only one gets read.
     */
    public function index(): JsonResponse
    {
        $contact = SupportContact::current();

        return response()->json([
            'success' => true,
            'data' => [
                'intro' => $contact->intro,
                'contact' => [
                    'email' => $contact->email,
                    'phone' => $contact->phone,
                    'whatsapp' => $contact->whatsapp,
                    'hours' => $contact->hours,
                ],
                'faqs' => Faq::visible()->get()->map(fn (Faq $faq) => [
                    'id' => $faq->id,
                    'question' => $faq->question,
                    'answer' => $faq->answer,
                ])->values(),
                'pages' => SupportPage::visible()->get()->map(fn (SupportPage $page) => [
                    'slug' => $page->slug,
                    'title' => $page->title,
                ])->values(),
            ],
            'message' => 'Support content retrieved',
        ]);
    }

    /** A single policy page, resolved by slug. */
    public function page(SupportPage $page): JsonResponse
    {
        abort_unless($page->is_published, 404);

        return response()->json([
            'success' => true,
            'data' => [
                'slug' => $page->slug,
                'title' => $page->title,
                'body' => $page->body,
                'updated_at' => $page->updated_at?->toDateString(),
            ],
            'message' => 'Page retrieved',
        ]);
    }

    /** Report a problem. Lands in the admin queue as a new report. */
    public function report(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();

        $report = SupportReport::create([
            'user_id' => $user->id,
            'subject' => $data['subject'],
            'message' => $data['message'],
        ]);

        AdminNotifier::alert(
            $user->country_id,
            'support_report',
            'New support report',
            $user->name . ': ' . $data['subject'],
            route('console.support.reports.show', $report),
        );

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Thank you — our team will look into this.',
        ], 201);
    }
}
