<?php

namespace App\Http\Controllers;

use App\Enums\ItemStatus;
use App\Http\Requests\Item\StoreItemRequest;
use App\Http\Requests\Item\UpdateItemRequest;
use App\Http\Resources\ItemResource;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Item::query()->marketplace();

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('search')) {
            $search = Str::lower($request->string('search')->toString());
            $like = '%'.$search.'%';

            $query->where(function ($builder) use ($like) {
                $builder
                    ->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(description) LIKE ?', [$like]);
            });
        }

        $items = $query->latest()->paginate(12);

        return response()->json([
            'data' => ItemResource::collection($items->getCollection()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function myItems(Request $request): JsonResponse
    {
        $items = $request->user()->items()
            ->with([
                'category',
                'owner',
                'activeLoan.borrower',
                'loans' => fn ($query) => $query
                    ->whereNotNull('approved_at')
                    ->whereNull('delivery_confirmed_at')
                    ->where('status', '!=', 'cancelled'),
            ])
            ->latest()
            ->get();

        return response()->json([
            'data' => ItemResource::collection($items),
        ]);
    }

    public function store(StoreItemRequest $request): JsonResponse
    {
        $payload = $request->safe()->except(['image']);
        $payload['status'] = ItemStatus::AVAILABLE->value;
        $payload['image_url'] = $this->storeImage($request) ?? ($payload['image_url'] ?? null);

        $item = $request->user()->items()->create($payload);
        $item->load(['category', 'owner']);

        return response()->json([
            'message' => 'Objeto publicado.',
            'data' => ItemResource::make($item),
        ], 201);
    }

    public function show(Request $request, Item $item): JsonResponse
    {
        $item->load([
            'owner',
            'category',
            'loans' => fn ($query) => $query
                ->where('status', 'returned')
                ->latest()
                ->limit(5),
        ]);

        if (!$this->canViewItem($request, $item)) {
            abort(404);
        }

        return response()->json([
            'data' => ItemResource::make($item),
        ]);
    }

    public function update(UpdateItemRequest $request, Item $item): JsonResponse
    {
        abort_unless($item->user_id === $request->user()->id, 403, 'No autorizado.');

        if ($item->status === ItemStatus::ON_LOAN->value || $item->hasPendingApprovedLoan()) {
            abort(422, 'No puedes editar un objeto comprometido en un préstamo.');
        }

        $payload = $request->safe()->except(['image', 'remove_image']);

        if ($request->boolean('remove_image') && $item->image_url) {
            $this->deleteImageIfLocal($item->image_url);
            $payload['image_url'] = null;
        }

        if ($request->hasFile('image')) {
            $this->deleteImageIfLocal($item->image_url);
            $payload['image_url'] = $this->storeImage($request);
        } elseif ($request->filled('image_url')) {
            $payload['image_url'] = $request->string('image_url')->toString();
        }

        $item->update($payload);
        $item->load(['category', 'owner']);

        return response()->json([
            'message' => 'Objeto actualizado.',
            'data' => ItemResource::make($item->fresh(['category', 'owner'])),
        ]);
    }

    public function destroy(Request $request, Item $item): JsonResponse
    {
        abort_unless($item->user_id === $request->user()->id, 403, 'No autorizado.');

        if ($item->status === ItemStatus::ON_LOAN->value || $item->hasPendingApprovedLoan()) {
            abort(422, 'No se puede eliminar un objeto comprometido en un préstamo.');
        }

        $this->deleteImageIfLocal($item->image_url);
        $item->delete();

        return response()->json([
            'message' => 'Objeto eliminado.',
        ]);
    }

    private function canViewItem(Request $request, Item $item): bool
    {
        return $item->status === ItemStatus::AVAILABLE->value;
    }

    private function storeImage(Request $request): ?string
    {
        if (!$request->hasFile('image')) {
            return null;
        }

        return $request->file('image')->store('items', 'public');
    }

    private function deleteImageIfLocal(?string $path): void
    {
        if (!$path || Str::startsWith($path, ['http://', 'https://'])) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
