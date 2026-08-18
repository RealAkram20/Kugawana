<?php

namespace App\Http\Controllers\Console;

use App\Enums\SupportReportStatus;
use App\Http\Controllers\Console\Concerns\ScopesCountry;
use App\Http\Controllers\Controller;
use App\Models\SupportReport;
use App\Notifications\KugawanaNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Illuminate\View\View;

class SupportReportController extends Controller
{
    use ScopesCountry;

    private function scoped()
    {
        return SupportReport::query()
            ->when($this->countryId(), fn ($q) => $q->whereHas('user', fn ($u) => $u->where('country_id', $this->countryId())));
    }

    public function index(Request $request): View
    {
        $status = $request->string('status')->trim()->value();

        $reports = $this->scoped()
            ->with(['user', 'handler'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return view('console.support.reports.index', [
            'title' => 'Reported problems',
            'reports' => $reports,
            'status' => $status,
            'counts' => $this->scoped()
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
        ]);
    }

    public function show(SupportReport $report): View
    {
        $this->guardScope($report);

        return view('console.support.reports.show', [
            'title' => 'Report #' . $report->id,
            'report' => $report->load(['user', 'handler']),
        ]);
    }

    /** A CountryAdmin may only handle reports from their own country's users. */
    private function guardScope(SupportReport $report): void
    {
        $countryId = $this->countryId();

        abort_if($countryId && $report->user?->country_id !== $countryId, 403);
    }

    public function update(Request $request, SupportReport $report): RedirectResponse
    {
        $this->guardScope($report);

        $data = $request->validate([
            'status' => ['required', new Enum(SupportReportStatus::class)],
            'admin_response' => ['nullable', 'string', 'max:5000'],
        ]);

        $closed = in_array($data['status'], [
            SupportReportStatus::Resolved->value,
            SupportReportStatus::Closed->value,
        ], true);

        // Stamp who closed it and when, so the queue keeps its own history without
        // the admin having to fill in two more fields by hand.
        $data['resolved_at'] = $closed ? ($report->resolved_at ?? now()) : null;
        $data['handled_by'] = $closed ? ($report->handled_by ?? auth()->id()) : $report->handled_by;

        $originalResponse = $report->admin_response;

        $report->update($data);

        // A member is only pinged when the admin actually writes back, not when a
        // status-only edit re-saves the same response.
        $reply = $data['admin_response'] ?? null;

        if ($reply && $reply !== $originalResponse) {
            $report->user?->notify(new KugawanaNotification(
                'support.reply',
                'Response to your report',
                $reply,
                'support',
                $report->id,
            ));
        }

        return redirect()->route('console.support.reports.index')->with('toast', 'Report updated');
    }
}
